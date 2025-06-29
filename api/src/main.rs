use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use dotenvy::from_path;
use sqlx::PgPool;
use std::env;

async fn index(db_pool: web::Data<PgPool>) -> impl Responder {
    let row: (String,) = sqlx::query_as("SELECT 'Hello from the database!'")
        .fetch_one(&**db_pool)
        .await
        .unwrap();

    HttpResponse::Ok().body(row.0)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Get --dev flag
    let is_dev = std::env::args().any(|arg| arg == "--dev");

    // Load .env from root
    let cwd = env::current_dir().expect("Could not get current directory");
    let dotenv_path = cwd.join("../.env");
    from_path(&dotenv_path).expect(&format!("Failed to load .env from {:?}", dotenv_path));

    // Choose DB connection credentials based on mode
    let (host, port, user, password, db) = if is_dev {
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
        if is_dev { "development" } else { "production" }
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
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
