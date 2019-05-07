DROP TABLE IF EXISTS orders,restaurants,users;
DROP TYPE IF EXISTS CUISINE;
CREATE TYPE CUISINE AS ENUM ('American','Cajun','Caribbean','Chinese','French','German','Greek','Indian','Italian','Japanese','Korean','Lebanese','Mediterranean','Mexican','Moroccan','Seafood','Soul','Spanish','Thai','Turkish','Vegetarian','Vietnamese');

-- users ------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- restaurants ------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS restaurants (
    user_id integer NOT NULL UNIQUE REFERENCES users(id),
    name VARCHAR(30) NOT NULL,
    cuisine CUISINE NOT NULL,
    address jsonb NOT NULL
);

-- orders ------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    restaurant_id integer NOT NULL REFERENCES restaurants(user_id),
    delivery_address jsonb NOT NULL,
    price money NOT NULL,
    prepaid boolean NOT NULL,
    time_placed timestamp with time zone NOT NULL,
    time_ready timestamp with time zone NOT NULL,
    time_expected timestamp with time zone NOT NULL,
    time_delivered timestamp with time zone
);

