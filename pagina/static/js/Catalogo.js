var DatosBD = "";

/* ==========================================
   DATOS DE SESIÓN
========================================== */

const usuarioSesion = sessionStorage.getItem("usuario");
const nombreSesion = sessionStorage.getItem("nombre");
const cargoSesion = sessionStorage.getItem("cargo");


/* ==========================================
   VALIDAR SESIÓN
========================================== */

if (!usuarioSesion) {

    window.location.href = "Index.html";

}


/* ==========================================
   CONFIGURAR INTERFAZ DEL USUARIO
========================================== */

function configurarInterfazUsuario() {

    const btnConfiguracion =
        document.getElementById("btnConfiguracion");

    const nombreUsuarioSesion =
        document.getElementById("nombreUsuarioSesion");

    const cargoUsuario =
        document.getElementById("cargoUsuario");


    /* MOSTRAR NOMBRE */

    if (nombreUsuarioSesion) {

        nombreUsuarioSesion.textContent =
            nombreSesion || usuarioSesion;

    }


    /* ADMINISTRADOR */

    if (cargoSesion === "1") {

        if (cargoUsuario) {

            cargoUsuario.textContent =
                "Administrador";

        }

        if (btnConfiguracion) {

            btnConfiguracion.style.display =
                "inline-flex";

        }

    }


    /* USUARIO NORMAL */

    else {

        if (cargoUsuario) {

            cargoUsuario.textContent =
                "Usuario";

        }

        if (btnConfiguracion) {

            btnConfiguracion.style.display =
                "none";

        }

    }

}


/* ==========================================
   CERRAR SESIÓN
========================================== */

function cerrarSesion() {

    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("nombre");
    sessionStorage.removeItem("cargo");

    window.location.href = "Index.html";

}


/* ==========================================
   MANEJO DE ERRORES
========================================== */

function onError() {

    console.error("Solicitud fallida");

    alert(
        "No fue posible obtener el catálogo de aplicaciones."
    );

}


/* ==========================================
   CONSULTAR CATÁLOGO
========================================== */

function process(callback) {

    const url =
        "http://localhost:8000/ConsultarCatalogo/";


    const xhr =
        new XMLHttpRequest();


    xhr.open(
        "GET",
        url,
        true
    );


    xhr.onreadystatechange =
        function () {

            if (xhr.readyState === 4) {

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    DatosBD =
                        xhr.responseText;

                    callback();

                }

                else {

                    console.error(
                        "Error en la consulta:",
                        xhr.status,
                        xhr.statusText
                    );

                    onError();

                }

            }

        };


    xhr.onerror =
        onError;


    xhr.send();

}


/* ==========================================
   RECIBIR DATOS DEL CATÁLOGO
========================================== */

function callbackFunction() {

    const tablaPaginas =
        document.getElementById("paginas");


    if (!tablaPaginas) {

        console.error(
            "No existe el contenedor #paginas"
        );

        return;

    }


    try {

        DatosBD =
            JSON.parse(DatosBD);

    }

    catch (error) {

        console.error(
            "Error al procesar los datos:",
            error
        );

        return;

    }


    tablaPaginas.innerHTML = "";


    MostrarPaginas();

}


/* ==========================================
   MOSTRAR APLICACIONES
========================================== */

function MostrarPaginas() {

    const tablaPaginas =
        document.getElementById("paginas");


    if (!tablaPaginas) {

        return;

    }


    if (!Array.isArray(DatosBD)) {

        console.error(
            "Los datos recibidos no son válidos"
        );

        return;

    }


    DatosBD.forEach(
        (pagina, index) => {

            const listItem =
                document.createElement("div");


            listItem.className =
                "catalog-item";


            listItem.innerHTML = `

                <div class="card">

                    <div
                        id="carta${index}"
                        class="face front"
                    >

                        <div class="card-image">

                            <img
                                src="${pagina.imagen}"
                                alt="${pagina.titulo}"
                            >

                        </div>


                        <div class="card-front-content">

                            <h3>
                                ${pagina.titulo}
                            </h3>


                            <span class="card-status">
                                Disponible
                            </span>

                        </div>

                    </div>


                    <div class="face back">

                        <div class="back-icon">
                            ◈
                        </div>


                        <h3>
                            ${pagina.titulo}
                        </h3>


                        <p>
                            ${pagina.descripcion}
                        </p>


                        <a
                            href="${pagina.direccion_url}"
                            class="app-button"
                        >

                            Abrir aplicación
                            <span>→</span>

                        </a>

                    </div>

                </div>

            `;


            tablaPaginas.appendChild(
                listItem
            );


            const fondo =
                document.getElementById(
                    "carta" + index
                );


            if (
                fondo &&
                pagina.color
            ) {

                fondo.style.setProperty(
                    "--card-color",
                    pagina.color
                );

            }

        }

    );

}


/* ==========================================
   INICIALIZAR LA PÁGINA
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* Configurar usuario */

        configurarInterfazUsuario();


        /* Botón cerrar sesión */

        const btnCerrarSesion =
            document.getElementById(
                "btnCerrarSesion"
            );


        if (btnCerrarSesion) {

            btnCerrarSesion.addEventListener(
                "click",
                cerrarSesion
            );

        }


        /* Cargar catálogo */

        process(
            callbackFunction
        );

    }

);