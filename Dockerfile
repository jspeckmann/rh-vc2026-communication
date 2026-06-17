FROM rust:1.95-slim AS build

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release --locked

FROM debian:trixie-slim

WORKDIR /app

ENV APP_HOST=0.0.0.0
ENV PORT=8001

COPY --from=build /app/target/release/team1-kommunikation /usr/local/bin/team1-kommunikation

EXPOSE 8001

CMD ["team1-kommunikation"]
