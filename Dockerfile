FROM postgres:11
ENV POSTGRES_USER colgworld
ENV POSTGRES_PASSWORD backdoor
ENV POSTGRES_DB gvDeliveryDB
ADD db_schema.sql /docker-entrypoint-initdb.d/