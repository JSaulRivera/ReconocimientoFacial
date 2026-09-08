let usuarioReconocido = false;
const elVideo = document.getElementById('video')
var usuariosBD = "";
navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)
var nombreUsuario = "";
document.getElementById("labeluser").style.visibility = 'hidden';
document.getElementById("labelpas").style.visibility = 'hidden';
document.getElementById("psw").style.visibility = 'hidden';


async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
}

const constraints = {
    audio: true,
    video: {
        width: 320,
        height: 240
    }
};

function handleSuccess(stream) {

    window.stream = stream;

    elVideo.srcObject = stream;

    elVideo.onloadedmetadata = () => {

        elVideo.play();

        console.log(
            "Video listo:",
            elVideo.videoWidth,
            "x",
            elVideo.videoHeight
        );

    };

}

// Cargar Modelos
let models = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(models),
    faceapi.nets.faceLandmark68Net.loadFromUri(models),
    faceapi.nets.faceRecognitionNet.loadFromUri(models),

]).then(init())

process(callbackFunction);

function onError() {
    alert("Solicitud fallida");
}

function process(callback) {
    url = "http://localhost:8000/ConsultarUsuario/"
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            usuariosBD = xhr.responseText;
            callback();
        }
    }
    xhr.send();
}

function callbackFunction() {

    usuariosBD = JSON.parse(usuariosBD);

    const canvas =
        document.getElementById("overlay");

    const ctx =
        canvas.getContext("2d");


    document.getElementById("proceso").innerHTML =
        "Realizando reconocimiento facial...";


    /*
        Esperamos a que el video tenga
        dimensiones reales
    */

    elVideo.addEventListener(
        "loadedmetadata",
        () => {

            console.log(
                "Dimensiones del video:",
                elVideo.videoWidth,
                "x",
                elVideo.videoHeight
            );


            canvas.width =
                elVideo.videoWidth;

            canvas.height =
                elVideo.videoHeight;

        },
        { once: true }
    );


    elVideo.addEventListener(
        "play",
        async () => {


            /*
                Crear descriptores de usuarios
            */

            const labeledFaceDescriptors =
                await Promise.all(

                    usuariosBD.map(
                        async reg => {

                            const label =
                                reg.usuario;


                            const faceDescriptors =
                                new Array(

                                    new Float32Array(
                                        reg.descriptores
                                            .split(",")
                                            .map(Number)
                                    )

                                );


                            return new faceapi.LabeledFaceDescriptors(

                                label,

                                faceDescriptors

                            );

                        }

                    )

                );


            /*
                Esperar dimensiones válidas
            */

            const esperarVideo = setInterval(
                () => {

                    if (

                        elVideo.videoWidth > 0 &&
                        elVideo.videoHeight > 0

                    ) {

                        clearInterval(esperarVideo);


                        iniciarReconocimiento(
                            labeledFaceDescriptors
                        );

                    }

                },

                100
            );

        },

        { once: true }

    );

}

function iniciarReconocimiento(
    labeledFaceDescriptors
) {


    const canvas =
        document.getElementById("overlay");


    const displaySize = {

        width: elVideo.videoWidth,

        height: elVideo.videoHeight

    };


    /*
        Configurar canvas
    */

    canvas.width =
        displaySize.width;

    canvas.height =
        displaySize.height;


    const ctx =
        canvas.getContext("2d");


    /*
        Crear comparador facial
    */

    const maxDescriptorDistance =
        0.6;


    const faceMatcher =
        new faceapi.FaceMatcher(

            labeledFaceDescriptors,

            maxDescriptorDistance

        );


    /*
        Ejecutar detección
    */

    ww = setInterval(
        async () => {


            /*
                Confirmar dimensiones
            */

            if (

                elVideo.videoWidth === 0 ||
                elVideo.videoHeight === 0

            ) {

                return;

            }


            document.getElementById(
                "proceso"
            ).innerHTML =
                "Buscando rostro...";


            /*
                Detectar rostro
            */

            const detections =
                await faceapi

                    .detectAllFaces(
                        elVideo
                    )

                    .withFaceLandmarks()

                    .withFaceDescriptors();


            /*
                Redimensionar resultados
            */

            const resizedDetections =
                faceapi.resizeResults(

                    detections,

                    displaySize

                );


            /*
                Limpiar canvas
            */

            ctx.clearRect(

                0,

                0,

                canvas.width,

                canvas.height

            );


            /*
                Si no hay rostro
            */

            if (

                resizedDetections.length === 0

            ) {

                return;

            }


            /*
                Dibujar cajas
            */

            faceapi.draw.drawDetections(

                canvas,

                resizedDetections

            );


            /*
                Dibujar puntos faciales
            */

            resizedDetections.forEach((detection) => {

                dibujarMallaFacial(
                    ctx,
                    detection.landmarks.positions
                );

            });


            /*
                Comparar rostros
            */

            const results =
                resizedDetections.map(

                    fd =>

                        faceMatcher.findBestMatch(

                            fd.descriptor

                        )

                );


            /*
                Dibujar nombre y porcentaje
            */

            results.forEach(

                (result, index) => {


                    const box =

                        resizedDetections[index]
                            .detection
                            .box;


                    /*
                        Convertir distancia
                        aproximada en porcentaje
                    */

                    let confianza =

                        Math.max(

                            0,

                            100 -

                            (
                                result.distance * 100
                            )

                        );


                    confianza =

                        confianza.toFixed(1);


                    const texto =

                        result.label === "unknown"

                            ? "DESCONOCIDO"

                            : `${result.label} - ${confianza}%`;


                    const drawBox =
                        new faceapi.draw.DrawBox(

                            box,

                            {

                                label:

                                    texto

                            }

                        );


                    drawBox.draw(
                        canvas
                    );

                }

            );


            /*
                Primer resultado
            */

            nombreUsuario =
                results[0].label;


            /*
                Usuario reconocido
            */

            if (
                nombreUsuario !== "unknown" &&
                !usuarioReconocido
            ) {

                usuarioReconocido = true;

                document.getElementById("proceso").innerHTML =
                    "Usuario identificado correctamente";

                UsuarioDetectado();

            }


        },

        500
    );

}

function dibujarMallaFacial(ctx, points) {

    // ==========================================
    // CONFIGURACIÓN VISUAL
    // ==========================================

    ctx.save();

    ctx.strokeStyle = "#00ffff";
    ctx.fillStyle = "#00ffff";

    ctx.lineWidth = 0.6;

    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 5;


    // ==========================================
    // CREAR TRIANGULACIÓN
    // ==========================================

    const triangles = triangulatePoints(points);


    // ==========================================
    // DIBUJAR TRIÁNGULOS
    // ==========================================

    triangles.forEach(triangle => {

        const p1 = points[triangle[0]];
        const p2 = points[triangle[1]];
        const p3 = points[triangle[2]];


        /*
            Calculamos el tamaño de los lados
            para evitar líneas demasiado largas.
        */

        const d1 = distancia(p1, p2);
        const d2 = distancia(p2, p3);
        const d3 = distancia(p3, p1);


        /*
            Ignorar triángulos demasiado grandes.

            Puedes aumentar o disminuir este valor.
        */

        const distanciaMaxima = 85;


        if (
            d1 > distanciaMaxima ||
            d2 > distanciaMaxima ||
            d3 > distanciaMaxima
        ) {

            return;

        }


        // Dibujar triángulo

        ctx.beginPath();

        ctx.moveTo(p1.x, p1.y);

        ctx.lineTo(p2.x, p2.y);

        ctx.lineTo(p3.x, p3.y);

        ctx.closePath();


        /*
            Variación visual en la intensidad
        */

        ctx.globalAlpha = 0.25 + Math.random() * 0.55;

        ctx.stroke();

    });


    // ==========================================
    // DIBUJAR PUNTOS
    // ==========================================

    ctx.globalAlpha = 1;

    points.forEach(point => {

        ctx.beginPath();

        ctx.arc(
            point.x,
            point.y,
            1.8,
            0,
            Math.PI * 2
        );

        ctx.fill();

    });


    ctx.restore();

}

function distancia(p1, p2) {

    return Math.sqrt(

        Math.pow(p2.x - p1.x, 2) +

        Math.pow(p2.y - p1.y, 2)

    );

}

function triangulatePoints(points) {

    const triangles = [];

    const total = points.length;


    /*
        Para cada punto buscamos
        sus puntos cercanos.
    */

    for (let i = 0; i < total; i++) {

        const vecinos = [];


        for (let j = 0; j < total; j++) {

            if (i === j) {
                continue;
            }


            vecinos.push({

                index: j,

                distance: distancia(
                    points[i],
                    points[j]
                )

            });

        }


        /*
            Ordenar por distancia
        */

        vecinos.sort(

            (a, b) =>

                a.distance - b.distance

        );


        /*
            Tomamos los 4 puntos
            más cercanos.
        */

        const cercanos = vecinos.slice(0, 4);


        /*
            Formar triángulos
        */

        for (
            let a = 0;
            a < cercanos.length;
            a++
        ) {

            for (
                let b = a + 1;
                b < cercanos.length;
                b++
            ) {

                const triangulo = [

                    i,

                    cercanos[a].index,

                    cercanos[b].index

                ].sort(
                    (a, b) => a - b
                );


                /*
                    Evitar duplicados
                */

                const existe = triangles.some(t =>

                    t[0] === triangulo[0] &&

                    t[1] === triangulo[1] &&

                    t[2] === triangulo[2]

                );


                if (!existe) {

                    /*
                        Verificar que los tres puntos
                        formen un triángulo real.
                    */

                    const p1 = points[triangulo[0]];
                    const p2 = points[triangulo[1]];
                    const p3 = points[triangulo[2]];


                    const area = Math.abs(

                        (
                            p1.x * (p2.y - p3.y) +

                            p2.x * (p3.y - p1.y) +

                            p3.x * (p1.y - p2.y)

                        ) / 2

                    );


                    /*
                        Ignorar triángulos casi planos
                    */

                    if (area > 5) {

                        triangles.push(
                            triangulo
                        );

                    }

                }

            }

        }

    }


    return triangles;

}

function UsuarioDetectado() {

    /*
        NO pausamos el video
    */

    // elVideo.pause();


    /*
        NO detenemos la detección
    */

    // clearInterval(ww);


    /*
        Mostramos usuario detectado
    */

    document.getElementById("proceso").innerHTML =
        "Usuario identificado correctamente";


    document.getElementById("labeluser").style.visibility =
        "visible";


    document.getElementById("nombreUser").innerHTML =
        nombreUsuario;


    document.getElementById("labelpas").style.visibility =
        "visible";


    document.getElementById("psw").style.visibility =
        "visible";

}

function ValidarUsuario() {

    const pass =
        document.getElementById("psw").value;


    const serchIndex =
        usuariosBD.findIndex(
            Usu => Usu.usuario == nombreUsuario
        );


    // Verificar que el usuario exista

    if (serchIndex === -1) {

        mostrarNotificacion(
            "No fue posible identificar al usuario.",
            "error"
        );

        return;
    }


    // Obtener datos del usuario

    const usuarioActual =
        usuariosBD[serchIndex];


    // Validar contraseña

    if (usuarioActual.pass == pass) {


        /*
        ==================================
        GUARDAR SESIÓN DEL USUARIO
        ==================================
        */

        sessionStorage.setItem(
            "usuario",
            usuarioActual.usuario
        );


        sessionStorage.setItem(
            "nombre",
            usuarioActual.nombre
        );


        sessionStorage.setItem(
            "cargo",
            usuarioActual.cargo
        );


        /*
        ==================================
        REDIRIGIR AL CATÁLOGO
        ==================================
        */

        window.location.href =
            "Catalogo.html";


    } else {

        mostrarNotificacion(
            "Contraseña incorrecta.",
            "error"
        );

    }

}