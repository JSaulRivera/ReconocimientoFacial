CREATE TABLE Paginas (
    Id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Titulo varchar(50) NOT NULL,
    Descripcion text NOT NULL,
    Direccion_url text NOT NULL,
    Imagen text,
    Color varchar(7),
    Posicion integer NOT NULL
);

CREATE TABLE Usuarios (
    Id_usuario integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Nombre varchar(35),
    Usuario varchar(80),
    Pass varchar(80),
    Cargo integer,
    Descriptores text
);