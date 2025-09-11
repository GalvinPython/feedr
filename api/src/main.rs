// Yes i regret using rust for this

use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use dotenvy::from_path;
use sqlx::{Column, PgPool, Row};
use std::sync::LazyLock;
use std::{collections::BTreeMap, env};

static IS_DEV: LazyLock<bool> = LazyLock::new(|| std::env::args().any(|arg| arg == "--dev"));

async fn index(db_pool: web::Data<PgPool>) -> impl Responder {
    let row: (String,) = sqlx::query_as("SELECT 'Hello from the database!'")
        .fetch_one(&**db_pool)
        .await
        .unwrap();

    HttpResponse::Ok().body(row.0)
}

pub async fn get_all_data(db_pool: web::Data<PgPool>) -> impl Responder {
    if !*IS_DEV {
        return HttpResponse::Ok().body("This endpoint is not available in production mode.");
    }

    let tables_query =
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
    let tables: Vec<(String,)> = sqlx::query_as(tables_query)
        .fetch_all(&**db_pool)
        .await
        .unwrap();

    let mut all_data = BTreeMap::new();

    for (table_name,) in tables {
        let query = format!("SELECT * FROM {}", table_name);
        let rows = sqlx::query(&query).fetch_all(&**db_pool).await.unwrap();

        let table_data: Vec<BTreeMap<String, Option<String>>> = rows
            .iter()
            .map(|row| {
                let mut map = BTreeMap::new();
                for (i, column) in row.columns().iter().enumerate() {
                    let value: Option<String> = row.try_get(i).unwrap_or(None);
                    map.insert(column.name().to_string(), value);
                }
                map
            })
            .collect();

        all_data.insert(table_name, table_data);
    }

    HttpResponse::Ok().json(all_data)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load .env from root
    let cwd = env::current_dir().expect("Could not get current directory");
    let dotenv_path = cwd.join("../.env");
    from_path(&dotenv_path).expect(&format!("Failed to load .env from {:?}", dotenv_path));

    // Choose DB connection credentials based on mode
    let (host, port, user, password, db) = if *IS_DEV {
        (
            env::var("POSTGRES_DEV_HOST").unwrap(),
            env::var("POSTGRES_DEV_PORT").unwrap(),
            env::var("POSTGRES_DEV_USER").unwrap(),
            env::var("POSTGRES_DEV_PASSWORD").unwrap(),
            env::var("POSTGRES_DEV_DB").unwrap(),
        )
    } else {
        (
            env::var("POSTGRES_HOST").unwrap(),
            env::var("POSTGRES_PORT").unwrap(),
            env::var("POSTGRES_USER").unwrap(),
            env::var("POSTGRES_PASSWORD").unwrap(),
            env::var("POSTGRES_DB").unwrap(),
        )
    };

    let db_url = format!("postgres://{}:{}@{}:{}/{}", user, password, host, port, db);
    println!("Connecting to DB at: {}", db_url);

    // Create the connection pool
    let db_pool = PgPool::connect(&db_url)
        .await
        .expect("Failed to connect to database");

    // Start the server
    println!(
        "Running in {} mode",
        if *IS_DEV { "development" } else { "production" }
    );
    println!("Server listening on http://127.0.0.1:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db_pool.clone()))
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header(),
            )
            .route("/", web::get().to(index))
            .route("/getall", web::get().to(get_all_data))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
