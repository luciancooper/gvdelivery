FROM postgres:11

ENV POSTGRES_USER postgres

ENV POSTGRES_PASSWORD backdoor

ENV POSTGRES_DB gvDeliveryDB

ADD db_schema.sql /docker-entrypoint-initdb.d/

EXPOSE 5432