// ==========================================
// ELEMENTOS HTML
// ==========================================

const video =
    document.getElementById("video");


const canvas =
    document.getElementById("overlay");


const proceso =
    document.getElementById("proceso");


const btnG =
    document.getElementById("btnG");


const scoreText =
    document.getElementById("scoreText");


const progressFill =
    document.getElementById("progressFill");


const errorMsgElement =
    document.getElementById("errorMsg");


// ==========================================
// VARIABLES
// ==========================================

let puntos = [];

let val = 1;

let score = 0;

let descriptoreUsuario = "";

let intervaloDeteccion = null;


// ==========================================
// CONFIGURACIÓN DE CÁMARA
// ==========================================

const constraints = {

    audio: false,

    video: {

        width: 320,

        height: 240

    }

};


// ==========================================
// INICIAR CÁMARA
// ==========================================

async function init() {

    try {

        const stream =
            await navigator
                .mediaDevices
                .getUserMedia(constraints);


        handleSuccess(stream);

    }

    catch (e) {

        console.error(e);


        if (errorMsgElement) {

            errorMsgElement.innerHTML =

                `Error al acceder a la cámara: ${e}`;

        }


        proceso.innerHTML =
            "ERROR DE CÁMARA";

    }

}


// ==========================================
// VIDEO LISTO
// ==========================================

function handleSuccess(stream) {

    window.stream = stream;

    video.srcObject = stream;


    video.onloadedmetadata = () => {

        video.play();

        console.log(

            "Cámara iniciada:",

            video.videoWidth,

            "x",

            video.videoHeight

        );

    };

}


// ==========================================
// CARGAR MODELOS
// ==========================================

const models =
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";


// Mostrar estado inicial

proceso.innerHTML =
    "CARGANDO MODELOS FACIALES...";


Promise.all([

    faceapi.nets
        .ssdMobilenetv1
        .loadFromUri(models),


    faceapi.nets
        .faceLandmark68Net
        .loadFromUri(models),


    faceapi.nets
        .faceRecognitionNet
        .loadFromUri(models)

])

.then(() => {

    proceso.innerHTML =
        "INICIANDO CÁMARA...";


    init();

})

.catch(error => {

    console.error(error);


    proceso.innerHTML =
        "ERROR AL CARGAR MODELOS";

});


// ==========================================
// CUANDO EL VIDEO COMIENZA
// ==========================================

video.addEventListener(
    "play",

    () => {

        iniciarDeteccion();

    }

);


// ==========================================
// INICIAR DETECCIÓN
// ==========================================

function iniciarDeteccion() {


    // Evitar múltiples intervalos

    if (intervaloDeteccion) {

        clearInterval(
            intervaloDeteccion
        );

    }


    // Esperar dimensiones reales

    const esperarVideo =
        setInterval(() => {


            if (

                video.videoWidth > 0 &&

                video.videoHeight > 0

            ) {

                clearInterval(
                    esperarVideo
                );


                comenzarReconocimiento();

            }

        },

        100
    );

}


// ==========================================
// PROCESAMIENTO FACIAL
// ==========================================

function comenzarReconocimiento() {


    const displaySize = {

        width:
            video.videoWidth,

        height:
            video.videoHeight

    };


    // Configurar canvas

    canvas.width =
        displaySize.width;


    canvas.height =
        displaySize.height;


    proceso.innerHTML =
        "BUSCANDO ROSTRO...";


    intervaloDeteccion =
        setInterval(

            async () => {


                try {


                    // =============================
                    // DETECTAR ROSTROS
                    // =============================

                    const detections =

                        await faceapi

                            .detectAllFaces(
                                video
                            )

                            .withFaceLandmarks()

                            .withFaceDescriptors();


                    // =============================
                    // LIMPIAR CANVAS
                    // =============================

                    const ctx =
                        canvas.getContext("2d");


                    ctx.clearRect(

                        0,

                        0,

                        canvas.width,

                        canvas.height

                    );


                    // =============================
                    // NO SE DETECTÓ ROSTRO
                    // =============================

                    if (

                        detections.length === 0

                    ) {


                        proceso.innerHTML =
                            "BUSCANDO ROSTRO...";


                        actualizarProgreso(0);


                        btnG.style.display =
                            "none";


                        return;

                    }


                    // =============================
                    // REDIMENSIONAR DETECCIONES
                    // =============================

                    const resizedDetections =

                        faceapi.resizeResults(

                            detections,

                            displaySize

                        );


                    // =============================
                    // DIBUJAR MALLA
                    // =============================

                    resizedDetections.forEach(

                        detection => {

                            dibujarMallaFacial(

                                ctx,

                                detection
                                    .landmarks
                                    .positions

                            );

                        }

                    );


                    // =============================
                    // GUARDAR DESCRIPTOR
                    // =============================

                    puntos =

                        new Float32Array(

                            detections[0]
                                .descriptor

                        );


                    // =============================
                    // OBTENER SCORE
                    // =============================

                    score =

                        detections[0]
                            .alignedRect
                            .score;


                    // Convertir score a porcentaje

                    const porcentaje =

                        Math.round(

                            score * 100

                        );


                    actualizarProgreso(
                        porcentaje
                    );


                    // =============================
                    // VALIDAR ROSTRO
                    // =============================

                    if (

                        score > 0.80

                    ) {


                        proceso.innerHTML =
                            "ROSTRO DETECTADO CORRECTAMENTE";


                        btnG.style.display =
                            "block";


                    }

                    else {


                        proceso.innerHTML =
                            "MEJORE LA POSICIÓN DEL ROSTRO";


                        btnG.style.display =
                            "none";

                    }


                }

                catch (error) {

                    console.error(

                        "Error en detección:",

                        error

                    );

                }


            },

            300

        );

}


// ==========================================
// ACTUALIZAR PROGRESO
// ==========================================

function actualizarProgreso(porcentaje) {


    scoreText.innerHTML =
        porcentaje + "%";


    progressFill.style.width =
        porcentaje + "%";

}


// ==========================================
// DISTANCIA ENTRE PUNTOS
// ==========================================

function distancia(p1, p2) {

    return Math.sqrt(

        Math.pow(
            p2.x - p1.x,
            2
        )

        +

        Math.pow(
            p2.y - p1.y,
            2
        )

    );

}


// ==========================================
// TRIANGULACIÓN
// ==========================================

function triangulatePoints(points) {


    const triangles = [];

    const total =
        points.length;


    for (

        let i = 0;

        i < total;

        i++

    ) {


        const vecinos = [];


        for (

            let j = 0;

            j < total;

            j++

        ) {


            if (

                i === j

            ) {

                continue;

            }


            vecinos.push({

                index:
                    j,


                distance:

                    distancia(

                        points[i],

                        points[j]

                    )

            });

        }


        // Ordenar por distancia

        vecinos.sort(

            (a, b) =>

                a.distance -
                b.distance

        );


        // Puntos cercanos

        const cercanos =
            vecinos.slice(0, 4);


        // Crear triángulos

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

                    (a, b) =>
                        a - b

                );


                const existe =

                    triangles.some(

                        t =>

                            t[0] === triangulo[0] &&

                            t[1] === triangulo[1] &&

                            t[2] === triangulo[2]

                    );


                if (

                    !existe

                ) {


                    const p1 =
                        points[triangulo[0]];


                    const p2 =
                        points[triangulo[1]];


                    const p3 =
                        points[triangulo[2]];


                    const area =

                        Math.abs(

                            (

                                p1.x *
                                (p2.y - p3.y)

                                +

                                p2.x *
                                (p3.y - p1.y)

                                +

                                p3.x *
                                (p1.y - p2.y)

                            )

                            / 2

                        );


                    if (

                        area > 5

                    ) {

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


// ==========================================
// DIBUJAR MALLA FACIAL
// ==========================================

function dibujarMallaFacial(

    ctx,

    points

) {


    ctx.save();


    ctx.strokeStyle =
        "#00d9ff";


    ctx.fillStyle =
        "#00ffff";


    ctx.lineWidth =
        0.6;


    ctx.globalAlpha =
        0.65;


    ctx.shadowColor =
        "#00d9ff";


    ctx.shadowBlur =
        5;


    const triangles =

        triangulatePoints(
            points
        );


    triangles.forEach(

        triangle => {


            const p1 =
                points[triangle[0]];


            const p2 =
                points[triangle[1]];


            const p3 =
                points[triangle[2]];


            const d1 =
                distancia(p1, p2);


            const d2 =
                distancia(p2, p3);


            const d3 =
                distancia(p3, p1);


            // Evitar líneas demasiado largas

            const distanciaMaxima =
                85;


            if (

                d1 > distanciaMaxima ||

                d2 > distanciaMaxima ||

                d3 > distanciaMaxima

            ) {

                return;

            }


            ctx.beginPath();


            ctx.moveTo(
                p1.x,
                p1.y
            );


            ctx.lineTo(
                p2.x,
                p2.y
            );


            ctx.lineTo(
                p3.x,
                p3.y
            );


            ctx.closePath();


            ctx.stroke();


        }

    );


    // =====================================
    // DIBUJAR PUNTOS
    // =====================================

    ctx.globalAlpha =
        1;


    points.forEach(

        point => {


            ctx.beginPath();


            ctx.arc(

                point.x,

                point.y,

                1.5,

                0,

                Math.PI * 2

            );


            ctx.fill();


        }

    );


    ctx.restore();

}


// ==========================================
// GUARDAR IMAGEN
// ==========================================

function GuardarImagen() {


    if (

        score > 0.80 &&

        val === 1

    ) {


        descriptoreUsuario =
            puntos.toString();


    }


    val = 0;


    /*
        No pausamos inmediatamente
        si quieres conservar el efecto
        hasta que termine la petición.
    */


    GuardarDatos();

}


// ==========================================
// GUARDAR DATOS
// ==========================================

function GuardarDatos() {


    const nombre =
        document
            .getElementById("nom")
            .value;


    const usuario =
        document
            .getElementById("usr")
            .value;


    const password =
        document
            .getElementById("psw")
            .value;


    const cargo =
        document
            .getElementById("crg")
            .value;


    // Validar formulario

    if (

        !nombre ||

        !usuario ||

        !password

    ) {


        alert(

            "Complete todos los campos."

        );


        return;

    }


    const datosUsuario = {

        nombre:
            nombre,


        usuario:
            usuario,


        pas:
            password,


        cargo:
            cargo,


        descriptores:
            descriptoreUsuario

    };


    proceso.innerHTML =
        "REGISTRANDO USUARIO...";


    consumirMetodo(

        "POST",

        "http://localhost:8000/RegistrarUsuario/",

        datosUsuario,

        onInsertItem

    );

}


// ==========================================
// CONSUMIR API
// ==========================================

function consumirMetodo(

    metodo,

    path,

    datos,

    loadMethod

) {


    const xhr =
        new XMLHttpRequest();


    xhr.open(

        metodo,

        path

    );


    xhr.setRequestHeader(

        "Content-Type",

        "application/json"

    );


    xhr.onload =
        loadMethod;


    xhr.onerror =
        onError;


    xhr.send(

        JSON.stringify(
            datos
        )

    );

}


// ==========================================
// RESPUESTA EXITOSA
// ==========================================

function onInsertItem() {


    if (

        this.status >= 200 &&

        this.status < 300

    ) {


        alert(
            this.response
        );


        window.location.href =
            "Index.html";


    }

    else {


        alert(

            "Error al registrar: " +

            this.status

        );

    }

}


// ==========================================
// ERROR
// ==========================================

function onError() {


    alert(
        "Solicitud fallida"
    );


    proceso.innerHTML =
        "ERROR DE CONEXIÓN";

}