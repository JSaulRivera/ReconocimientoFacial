from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import influxdb_client, os, time
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime
import psycopg2
import json


app = FastAPI()

app.mount("/static", StaticFiles(directory="./pagina/static"), name="static")

origins =["*"]

app.add_middleware(CORSMiddleware,allow_origins = origins, allow_credentials = True, allow_methods =["*"], allow_headers = ["*"]) 

class Sensores(BaseModel):
    datos: str
    temperatura: int
    humedad: int
    alcohol: float
    glp: float
    co: float
    humo: float
    propano: float
    hidrogeno: float

class Usuario(BaseModel):
    nombre: str
    usuario: str
    pas: str
    cargo: int
    descriptores: str

class Demo(BaseModel):
    titulo: str
    descripcion: str
    direccion_url: str
    imagen: str
    color: str
    posicion: int

class Demo2(BaseModel):
    id:int
    titulo: str
    descripcion: str
    direccion_url: str
    imagen: str
    color: str
    posicion: int

@app.get("/",response_class=FileResponse)
async def main():
    return "./pagina/static/html/Index.html"

@app.get("/hola")
def ho():
    return "hola"

@app.post("/")
def insertar_datos(val: Sensores):
    #establecer conexion a influxDB
    token = "QYYjI75c7kb8qL3m_iOxl9WhjOj2senBps_YrZD-PGVGJiLtJDWS62lrQQFxbKSX6lvOyiKgOCWzou4ZtlnvLQ==" # local
    org = "IUCA"
    url = "http://localhost:8086" #local
    client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
    bucket = "DatosSensores"
    write_api = client.write_api(write_options=SYNCHRONOUS)

    #Establecer conexion a TimescaleDB
    CONNECTION = "postgres://postgres:sigsa123@localhost:5432/datos_sensores"
    conn = psycopg2.connect(CONNECTION)

    # Insertar datos a influxDB
    point = (
        Point("RegistroDatosSensores")
        .tag("DatosSensores", val.datos)
        .field("Temperatura", val.temperatura)
        .field("Humedad", val.humedad)
        .field("Alchol", val.alcohol)
        .field("Glp", val.glp)
        .field("Co", val.co)
        .field("Humo", val.humo)
        .field("Propano", val.propano)
        .field("Hidrogeno", val.hidrogeno)
    )
    write_api.write(bucket=bucket, org="IUCA", record=point)

    # Insertar datos a timescale
    cursor = conn.cursor()
    cursor.execute("INSERT INTO registro_datos_sensores (time, datos, temperatura, humedad, alcohol,"
                    " glp, co, humo, propano, hidrogeno)"
                        " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);",
                    (datetime.now(), val.datos, val.temperatura, val.humedad, val.alcohol,
                    val.glp, val.co, val.humo, val.propano, val.hidrogeno))
    conn.commit()

    return {"mensaje": f"informacion de {val.datos} insertado"}

@app.post("/RegistrarUsuario")
def insertar_usuario(val: Usuario):
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO usuarios (nombre, usuario, pass, cargo, descriptores)"
                        " VALUES (%s, %s, %s, %s, %s);",
                    ( val.nombre, val.usuario, val.pas, val.cargo,val.descriptores))
    conn.commit()

    return {"Registro exitoso"}

@app.get("/ConsultarUsuario")
def consultar_usuario():  
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    cursor.execute("SELECT nombre, usuario, pass, cargo, descriptores from usuarios")
    filas = cursor.fetchall()
    resultado_json = []
    for fila in filas:
        usuario_dict = {
            'nombre': fila[0],
            'usuario': fila[1],
            'pass': fila[2],
            'cargo': fila[3],
            'descriptores': fila[4]
            }
        resultado_json.append(usuario_dict)
    conn.commit()


    return resultado_json

@app.get("/ConsultarCatalogo")
def consultar_catalogo():
    
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    cursor.execute("SELECT id,titulo, descripcion, direccion_url, imagen, color, posicion from paginas order by posicion")
    filas = cursor.fetchall()
    resultado_json = []
    for fila in filas:
        catalogo_dict = {
            'id':fila[0],
            'titulo': fila[1],
            'descripcion': fila[2],
            'direccion_url': fila[3],
            'imagen': fila[4],
            'color': fila[5],
            'posicion': fila[6]
            }
        resultado_json.append(catalogo_dict)
    conn.commit()


    return resultado_json

@app.post("/InsertarDemo")
def insertar_demo(val: Demo):
    
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO paginas (titulo, descripcion, direccion_url, imagen, color, posicion)"
                        " VALUES (%s, %s, %s, %s, %s, %s);",
                    ( val.titulo, val.descripcion, val.direccion_url, val.imagen, val.color, val.posicion))
    conn.commit()

    return {"informacion insertada"}

@app.get("/ConsultarCatalogoID/{id}")
def consultar_catalogo_id(id):
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    sql="SELECT id, titulo, descripcion, direccion_url, imagen, color, posicion from paginas where id="+id
    cursor.execute(sql)
    filas = cursor.fetchall()
    resultado_json = []
    for fila in filas:
        catalogo_dict = {
            'id':fila[0],
            'titulo': fila[1],
            'descripcion': fila[2],
            'direccion_url': fila[3],
            'imagen': fila[4],
            'color': fila[5],
            'posicion': fila[6]
            }
        resultado_json.append(catalogo_dict)
    conn.commit()


    return resultado_json

@app.get("/ConsultarCatalogoTitulo/{titulo}")
def consultar_catalogo_titulo(titulo):
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    sql="SELECT id,titulo, descripcion, direccion_url, imagen, color, posicion from paginas where titulo='"+titulo+"'"
    cursor.execute(sql)
    filas = cursor.fetchall()
    resultado_json = []
    for fila in filas:
        catalogo_dict = {
            'id':fila[0],
            'titulo': fila[1],
            'descripcion': fila[2],
            'direccion_url': fila[3],
            'imagen': fila[4],
            'color': fila[5],
            'posicion': fila[6]
            }
        resultado_json.append(catalogo_dict)
    conn.commit()


    return resultado_json

@app.delete("/EliminarDemo/{id}")
def eliminar_demo(id):
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    sql="DELETE FROM paginas where id="+id
    cursor.execute(sql)
    conn.commit()

    return "informacion eliminada"

@app.put("/ActualizarDemoPosicion/{posicion},{titulo}")
def actualizar_demoPos(posicion, titulo):
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    sql="UPDATE paginas SET posicion="+posicion+" where titulo='"+titulo+"'"
    cursor.execute(sql)
    conn.commit()

    return f"informacion actualizada"

@app.put("/ActualizarDemo")
def actualizar_demo(dat: Demo2):
    
    CONNECTION = "postgres://postgres:lanivaje@localhost:5432/ReconocimientoFacial"
    conn = psycopg2.connect(CONNECTION)
    cursor = conn.cursor()
    sql="UPDATE paginas SET titulo='"+dat.titulo+"', descripcion='"+dat.descripcion +"', direccion_url='"+dat.direccion_url+"', imagen='"+dat.imagen +"', color='"+dat.color+"', posicion="+str(dat.posicion)+" where id="+str(dat.id)
    cursor.execute(sql)
    conn.commit()
    return "informacion actualizada"