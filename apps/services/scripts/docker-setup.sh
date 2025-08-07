#!/bin/bash

# Aluuna Services Docker Setup Script
# This script helps set up the Docker environment for development and production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Header
print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Aluuna Services Docker Setup              ║"
    echo "║                        Version 2.0                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. Consider running as a regular user for development."
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    # Check available disk space (at least 2GB)
    DISK_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [ "$DISK_SPACE" -lt 2097152 ]; then
        warn "Low disk space detected. At least 2GB recommended."
    fi
    
    success "Prerequisites check passed!"
}

# Create .env file from template
create_env_file() {
    log "Setting up environment configuration..."
    
    # Check if .env.example exists
    if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
        warn ".env.example not found, creating basic .env file..."
        cat > "$ENV_FILE" << 'EOF'
# =============================================================================
# Aluuna Services Environment Configuration
# =============================================================================

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/aluuna
POSTGRES_DB=aluuna
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=
REDIS_HOST=redis
REDIS_PORT=6379

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000

# Security
ALUUNA_APP_API_KEY=your-secret-api-key-here
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8080
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Health Check
HEALTH_CHECK_INTERVAL=30000
EOF
    else
        log "Using .env.example as template..."
        cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    fi
    
    if [ -f "$ENV_FILE" ]; then
        success "Environment file created: $ENV_FILE"
        warn "Please update $ENV_FILE with your actual API keys and configuration."
    else
        error "Failed to create environment file."
        exit 1
    fi
}

# Validate environment file
validate_env_file() {
    log "Validating environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        return 1
    fi
    
    # Check for required variables
    local required_vars=("DATABASE_URL" "POSTGRES_PASSWORD" "ALUUNA_APP_API_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" || grep -q "^${var}=$" "$ENV_FILE" || grep -q "^${var}=your-" "$ENV_FILE"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        warn "The following environment variables need to be configured:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    success "Environment configuration validated!"
    return 0
}

# Build Docker images
build_images() {
    local compose_file=${1:-$COMPOSE_FILE}
    local no_cache=${2:-false}
    
    log "Building Docker images..."
    
    if [ "$no_cache" = true ]; then
        log "Building without cache..."
        docker-compose -f "$compose_file" build --no-cache
    else
        docker-compose -f "$compose_file" build
    fi
    
    if [ $? -eq 0 ]; then
        success "Docker images built successfully!"
    else
        error "Failed to build Docker images."
        exit 1
    fi
}

# Start services
start_services() {
    local compose_file=${1:-$COMPOSE_FILE}
    local detach=${2:-true}
    
    log "Starting services..."
    
    if [ "$detach" = true ]; then
        docker-compose -f "$compose_file" up -d
    else
        docker-compose -f "$compose_file" up
    fi
    
    if [ $? -eq 0 ]; then
        success "Services started successfully!"
    else
        error "Failed to start services."
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    log "Waiting for PostgreSQL..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            success "PostgreSQL is ready!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "PostgreSQL failed to start within expected time."
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    # Wait for Redis
    log "Waiting for Redis..."
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T redis redis-cli ping &> /dev/null; then
            success "Redis is ready!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Redis failed to start within expected time."
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait a bit more for the database to be fully ready
    sleep 5
    
    # Run Prisma migrations
    if docker-compose exec -T aluuna-services bunx prisma db push; then
        success "Database migrations completed!"
    else
        error "Database migrations failed."
        exit 1
    fi
}

# Generate Prisma client
generate_prisma_client() {
    log "Generating Prisma client..."
    
    if docker-compose exec -T aluuna-services bunx prisma generate; then
        success "Prisma client generated!"
    else
        error "Failed to generate Prisma client."
        exit 1
    fi
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check if all containers are running
    local containers=$(docker-compose ps -q)
    local running_containers=$(docker-compose ps -q --filter "status=running")
    
    if [ "$containers" = "$running_containers" ]; then
        success "All services are running!"
    else
        warn "Some services may not be running properly."
        docker-compose ps
    fi
    
    # Check service endpoints
    log "Checking service endpoints..."
    
    # Wait for the main service to be ready
    sleep 10
    
    if curl -f http://localhost:3000/health &> /dev/null; then
        success "Main service is responding!"
    else
        warn "Main service health check failed. It may still be starting up."
    fi
}

# Start development environment
start_dev() {
    print_header
    check_prerequisites
    
    log "Starting development environment..."
    
    # Create environment file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        create_env_file
    fi
    
    # Validate environment
    if ! validate_env_file; then
        warn "Environment validation failed. Please update your .env file."
        echo "You can continue, but some features may not work properly."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Build and start services
    build_images
    start_services
    
    # Wait for services and run migrations
    wait_for_services
    run_migrations
    generate_prisma_client
    
    # Check health
    check_health
    
    # Display information
    echo
    echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Development environment is ready!${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${BLUE}Services:${NC}"
    echo -e "  🌐 Main Service: ${GREEN}http://localhost:3000${NC}"
    echo -e "  🗄️  Database: ${GREEN}localhost:5432${NC}"
    echo -e "  🔴 Redis: ${GREEN}localhost:6379${NC}"
    echo -e "  📊 Redis Commander: ${GREEN}http://localhost:8081${NC}"
    echo
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  📋 View logs: ${YELLOW}./scripts/docker-setup.sh logs${NC}"
    echo -e "  🛑 Stop services: ${YELLOW}./scripts/docker-setup.sh stop${NC}"
    echo -e "  📊 Check status: ${YELLOW}./scripts/docker-setup.sh status${NC}"
    echo -e "  🧹 Cleanup: ${YELLOW}./scripts/docker-setup.sh cleanup${NC}"
    echo
}

# Start production environment
start_prod() {
    print_header
    check_prerequisites
    
    log "Starting production environment..."
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        echo "Please create and configure your production environment file."
        exit 1
    fi
    
    if ! validate_env_file; then
        error "Environment validation failed. Please update your .env file."
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_PROD_FILE" ]; then
        error "Production compose file not found: $COMPOSE_PROD_FILE"
        exit 1
    fi
    
    # Build and start production services
    build_images "$COMPOSE_PROD_FILE" true
    start_services "$COMPOSE_PROD_FILE"
    
    # Wait for services
    wait_for_services "$COMPOSE_PROD_FILE"
    run_migrations
    generate_prisma_client
    
    # Check health
    check_health
    
    success "Production environment is ready!"
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    if docker-compose down; then
        success "Services stopped successfully!"
    else
        error "Failed to stop services."
        exit 1
    fi
}

# View logs
view_logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        log "Viewing logs for $service..."
        docker-compose logs -f "$service"
    else
        log "Viewing all service logs..."
        docker-compose logs -f
    fi
}

# Clean up Docker resources
cleanup() {
    log "Cleaning up Docker resources..."
    
    echo "This will remove all containers, volumes, and images for this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker system prune -f
        success "Cleanup complete!"
    else
        info "Cleanup cancelled."
    fi
}

# Show service status
show_status() {
    log "Service Status:"
    echo
    docker-compose ps
    echo
    
    # Show resource usage
    log "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        success "Services restarted successfully!"
    else
        error "Failed to restart services."
        exit 1
    fi
}

# Update services
update_services() {
    log "Updating services..."
    
    # Pull latest images
    docker-compose pull
    
    # Rebuild and restart
    build_images "" true
    restart_services
    
    success "Services updated successfully!"
}

# Show help
show_help() {
    print_header
    echo "Usage: $0 {command} [options]"
    echo
    echo "Commands:"
    echo -e "  ${GREEN}dev${NC}              - Start development environment"
    echo -e "  ${GREEN}prod${NC}             - Start production environment"
    echo -e "  ${GREEN}stop${NC}             - Stop all services"
    echo -e "  ${GREEN}restart${NC}          - Restart all services"
    echo -e "  ${GREEN}logs${NC} [service]   - View service logs"
    echo -e "  ${GREEN}status${NC}           - Show service status"
    echo -e "  ${GREEN}cleanup${NC}          - Clean up Docker resources"
    echo -e "  ${GREEN}env${NC}              - Create .env file"
    echo -e "  ${GREEN}update${NC}           - Update services"
    echo -e "  ${GREEN}help${NC}             - Show this help message"
    echo
    echo "Examples:"
    echo "  $0 dev                    # Start development environment"
    echo "  $0 logs aluuna-services   # View logs for specific service"
    echo "  $0 status                 # Check service status"
    echo
}

# Main script logic
main() {
    local command=${1:-"help"}
    
    case "$command" in
        "dev")
            start_dev
            ;;
        "prod")
            start_prod
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            view_logs "$2"
            ;;
        "cleanup")
            cleanup
            ;;
        "status")
            show_status
            ;;
        "env")
            create_env_file
            ;;
        "update")
            update_services
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Unknown command: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 