CREATE TABLE public.orders
(
    id serial NOT NULL,
    restaurant_id integer NOT NULL,
    delivery_address jsonb NOT NULL,
    price money NOT NULL,
    prepaid boolean NOT NULL,
    time_placed timestamp with time zone NOT NULL,
    time_ready timestamp with time zone NOT NULL,
    time_expected timestamp with time zone NOT NULL,
    time_delivered timestamp with time zone NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (id)
,
    FOREIGN KEY (restaurant_id)
        REFERENCES public.restaurants (client_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
);

ALTER TABLE public.orders
    OWNER to postgres;