var DatosDB = "";
var test2 = [];
var lista = [];

var imagen = "";
var imagenname = "";
var color = "";
var posicion = "";
var IdPagina = null;

var elementoSeleccionado = null;

/* ==========================================
   PROTEGER CONFIGURACIÓN
========================================== */

const usuarioSesion =
    sessionStorage.getItem("usuario");

const cargoSesion =
    sessionStorage.getItem("cargo");


/*
   Si no existe sesión
*/

if (!usuarioSesion) {

    window.location.href =
        "Index.html";

}


/*
   Si no es administrador
*/

else if (cargoSesion != "1") {

    window.location.href =
        "Catalogo.html";

}

/* =========================================================
   IMAGEN
========================================================= */

function showname() {

    const input = document.getElementById("fileInput");

    if (!input.files || input.files.length === 0) {
        return;
    }

    imagenname = "/static/img/" + input.files.item(0).name;

    const img = document.getElementById("img1");
    img.src = imagenname;
}


/* =========================================================
   INSERTAR
========================================================= */

function InsertarDatos() {

    let titulo = document.getElementById("titulo").value.trim();
    let descripcion = document.getElementById("descripcion").value.trim();
    let direccion_url = document.getElementById("direccion_url").value.trim();

    let imagenNueva = imagenname;
    let colorNuevo = document.getElementById("color").value;

    let nuevaPosicion =
        document.getElementsByTagName("LI").length + 1;


    const demo = {

        titulo: titulo,
        descripcion: descripcion,
        direccion_url: direccion_url,
        imagen: imagenNueva,
        color: colorNuevo,
        posicion: nuevaPosicion
    };


    consumirMetodo(
        "POST",
        "http://localhost:8000/InsertarDemo/",
        demo,
        onInsertItem
    );
}


/* =========================================================
   CONSULTAR POR ID
========================================================= */

function DatosPagina() {

    let id = document.getElementById("id").value;

    if (!id) {
        alert("Seleccione una aplicación.");
        return;
    }

    let url =
        "http://localhost:8000/ConsultarCatalogoID/" + id;

    consumirMetodo(
        "GET",
        url,
        undefined,
        onGetItems
    );
}


/* =========================================================
   CONSULTAR POR TITULO
========================================================= */

function obtenerID(NombreTitulo) {

    let url =
        "http://localhost:8000/ConsultarCatalogoTitulo/" +
        encodeURIComponent(NombreTitulo);

    consumirMetodo(
        "GET",
        url,
        undefined,
        onGetItems
    );
}


/* =========================================================
   CONSULTAR CATALOGO
========================================================= */

function ConsultarDatos() {

    consumirMetodo(
        "GET",
        "http://localhost:8000/ConsultarCatalogo/",
        undefined,
        onGetItems
    );
}


/* =========================================================
   ACTUALIZAR
========================================================= */

function ActualizarDatos() {

    if (IdPagina === null || IdPagina === undefined) {

        alert("Seleccione primero una aplicación.");

        return;
    }


    let titulo =
        document.getElementById("titulo").value.trim();

    let descripcion =
        document.getElementById("descripcion").value.trim();

    let direccion_url =
        document.getElementById("direccion_url").value.trim();


    /*
        Si el usuario seleccionó una nueva imagen,
        utilizamos la nueva.
    */

    if (
        document.getElementById("fileInput").files.length > 0
    ) {

        imagen = imagenname;
    }


    /*
        Siempre obtenemos el color actual del input.
    */

    color =
        document.getElementById("color").value;


    const demo = {

        id: IdPagina,

        titulo: titulo,

        descripcion: descripcion,

        direccion_url: direccion_url,

        imagen: imagen,

        color: color,

        posicion: posicion
    };


    console.log("Actualizando:", demo);


    consumirMetodo(
        "PUT",
        "http://localhost:8000/ActualizarDemo/",
        demo,
        onInsertItem
    );
}


/* =========================================================
   ACTUALIZAR POSICION
========================================================= */

function ActualizarPosicion(tit, pos) {

    let titulo = tit;
    let nuevaPosicion = pos;


    let url =
        "http://localhost:8000/ActualizarDemoPosicion/" +
        nuevaPosicion +
        "," +
        encodeURIComponent(titulo);


    consumirMetodo(
        "PUT",
        url,
        undefined,
        undefined
    );
}


/* =========================================================
   ELIMINAR
========================================================= */

// function EliminarDatos() {

//     if (IdPagina === null || IdPagina === undefined) {

//         alert("Seleccione primero una aplicación.");

//         return;
//     }


//     const confirmar = confirm(
//         "¿Está seguro de eliminar la aplicación seleccionada?"
//     );


//     if (!confirmar) {

//         return;
//     }


//     let url =
//         "http://localhost:8000/EliminarDemo/" + IdPagina;


//     consumirMetodo(
//         "DELETE",
//         url,
//         undefined,
//         onInsertItem
//     );
// }

function EliminarDatos() {

    // Verificar que exista una aplicación seleccionada

    if (
        !IdPagina ||
        IdPagina === null ||
        IdPagina === undefined
    ) {

        mostrarNotificacion(
            "Seleccione primero una aplicación.",
            "warning"
        );

        return;
    }


    // Mostrar confirmación personalizada

    const modal =
        document.getElementById(
            "modalConfirmacion"
        );


    modal.classList.add(
        "activo"
    );
}

function confirmarEliminacion() {

    const modal =
        document.getElementById(
            "modalConfirmacion"
        );


    // Cerrar ventana de confirmación

    modal.classList.remove(
        "activo"
    );


    // Obtener ID seleccionado

    const id = IdPagina;


    const url =
        "http://localhost:8000/EliminarDemo/" + id;


    // Ejecutar eliminación

    consumirMetodo(
        "DELETE",
        url,
        undefined,
        onInsertItem
    );
}

/* =========================================================
   METODO GENERAL PARA PETICIONES
========================================================= */

function consumirMetodo(
    metodo,
    path,
    datos,
    loadMethod
) {

    let xhr = new XMLHttpRequest();

    xhr.open(metodo, path);

    xhr.setRequestHeader(
        "Content-Type",
        "application/json"
    );


    if (datos !== undefined) {

        xhr.send(JSON.stringify(datos));

    } else {

        xhr.send();
    }


    if (loadMethod !== undefined) {

        xhr.onload = loadMethod;
    }


    xhr.onerror = onError;
}


/* =========================================================
   RESPUESTA CONSULTA
========================================================= */

function onGetItems() {

    let respuesta = JSON.parse(this.response);


    /*
        Algunos endpoints pueden regresar un arreglo
        y otros un objeto.
    */

    let item =
        Array.isArray(respuesta)
            ? respuesta[0]
            : respuesta;


    if (!item) {

        alert("No se encontró la aplicación.");

        return;
    }


    cargarDatosEnFormulario(item);
}


/* =========================================================
   CARGAR DATOS EN FORMULARIO
========================================================= */

function cargarDatosEnFormulario(item) {

    /*
        Guardamos el ID de la aplicación seleccionada
    */

    IdPagina = item.id;


    /*
        MUY IMPORTANTE:
        input y textarea utilizan .value
        NO innerHTML
    */

    document.getElementById("id").value =
        item.id || "";

    document.getElementById("titulo").value =
        item.titulo || "";

    document.getElementById("descripcion").value =
        item.descripcion || "";

    document.getElementById("direccion_url").value =
        item.direccion_url || "";


    /*
        Guardamos información necesaria para actualizar
    */

    imagen = item.imagen || "";

    color = item.color || "#000000";

    posicion = item.posicion || 1;


    /*
        Actualizamos el color
    */

    document.getElementById("color").value =
        color;


    /*
        Mostramos la imagen
    */

    const img =
        document.getElementById("img1");


    if (imagen !== "") {

        img.src = imagen;

    } else {

        img.removeAttribute("src");
    }


    console.log(
        "Aplicación seleccionada:",
        {
            IdPagina,
            imagen,
            color,
            posicion
        }
    );
}


/* =========================================================
   RESPUESTA INSERTAR / ACTUALIZAR / ELIMINAR
========================================================= */

function onInsertItem() {

    mostrarNotificacion(
        this.response,
        "success"
    );


    /*
       Esperamos a que el usuario vea
       la notificación antes de recargar
    */

    const botonCerrar =
        document.getElementById(
            "btnCerrarModal"
        );


    botonCerrar.onclick = function () {

        cerrarNotificacion();

        location.reload();
    };
}


/* =========================================================
   ERROR
========================================================= */

function onError() {

    alert("Solicitud fallida");

}


/* =========================================================
   CARGAR CATALOGO
========================================================= */

function process(callback) {

    const url =
        "http://localhost:8000/ConsultarCatalogo/";


    const xhr = new XMLHttpRequest();


    xhr.open(
        "GET",
        url,
        true
    );


    xhr.onreadystatechange =
        function () {

            if (
                xhr.readyState === 4 &&
                xhr.status === 200
            ) {

                test2 =
                    JSON.parse(xhr.responseText);

                callback();

            }

        };


    xhr.send();
}


/* =========================================================
   INICIALIZAR
========================================================= */

process(callbackFunction);


/* =========================================================
   CREAR LISTA
========================================================= */

function callbackFunction() {

    const draggable_list =
        document.getElementById("draggable-list");


    if (!draggable_list) {

        console.error(
            "No existe el elemento #draggable-list"
        );

        return;
    }


    /*
        Limpiamos la lista antes de agregar elementos
    */

    draggable_list.innerHTML = "";


    const listItems = [];

    let dragStartIndex;


    createList();


    function createList() {

        test2.forEach(
            (pagina, index) => {

                const listItem =
                    document.createElement("li");


                listItem.index = index;

                listItem.id = pagina.id;

                listItem.setAttribute(
                    "data-index",
                    index
                );


                listItem.innerHTML = `

                    <span class="number">
                        ${index + 1}
                    </span>

                    <div
                        class="draggable"
                        draggable="true"
                    >

                        <p class="person-name">
                            ${pagina.titulo}
                        </p>

                    </div>

                `;


                /*
                    EVENTO PARA SELECCIONAR
                */

                listItem.addEventListener(
                    "click",
                    function () {

                        seleccionarPagina(
                            pagina,
                            listItem
                        );

                    }
                );


                listItems.push(listItem);

                draggable_list.appendChild(
                    listItem
                );

            }
        );


        addEventListeners();
    }


    /* =====================================================
       SELECCIONAR PAGINA
    ===================================================== */

    function seleccionarPagina(
        pagina,
        elemento
    ) {


        /*
            Quitamos la selección anterior
        */

        document
            .querySelectorAll(
                ".draggable-list li"
            )
            .forEach(
                li => {

                    li.classList.remove(
                        "selected"
                    );

                }
            );


        /*
            Marcamos el elemento actual
        */

        elemento.classList.add(
            "selected"
        );


        elementoSeleccionado =
            elemento;


        /*
            Cargamos la información
        */

        cargarDatosEnFormulario(
            pagina
        );
    }


    /* =====================================================
       DRAG START
    ===================================================== */

    function dragStart() {

        dragStartIndex =
            +this.closest("li")
                .getAttribute("data-index");

    }


    function dragEnter() {

        this.classList.add(
            "over"
        );

    }


    function dragLeave() {

        this.classList.remove(
            "over"
        );

    }


    function dragOver(e) {

        e.preventDefault();

    }


    function dragDrop() {

        const dragEndIndex =
            +this.getAttribute(
                "data-index"
            );


        swapItems(
            dragStartIndex,
            dragEndIndex
        );


        this.classList.remove(
            "over"
        );

    }


    /* =====================================================
       INTERCAMBIAR ELEMENTOS
    ===================================================== */

    function swapItems(
        fromIndex,
        toIndex
    ) {

        const itemOne =
            listItems[fromIndex]
                .querySelector(
                    ".draggable"
                );


        const itemTwo =
            listItems[toIndex]
                .querySelector(
                    ".draggable"
                );


        const tituloUno =
            itemOne.innerText.trim();

        const tituloDos =
            itemTwo.innerText.trim();


        /*
            Actualizamos las posiciones
        */

        ActualizarPosicion(
            tituloUno,
            toIndex + 1
        );


        ActualizarPosicion(
            tituloDos,
            fromIndex + 1
        );


        /*
            Intercambiamos visualmente
        */

        listItems[fromIndex]
            .appendChild(itemTwo);

        listItems[toIndex]
            .appendChild(itemOne);

    }


    /* =====================================================
       EVENTOS DRAG & DROP
    ===================================================== */

    function addEventListeners() {


        const draggables =
            document.querySelectorAll(
                ".draggable"
            );


        const dragListItems =
            document.querySelectorAll(
                ".draggable-list li"
            );


        draggables.forEach(
            draggable => {

                draggable.addEventListener(
                    "dragstart",
                    dragStart
                );

            }
        );


        dragListItems.forEach(
            item => {

                item.addEventListener(
                    "dragover",
                    dragOver
                );


                item.addEventListener(
                    "drop",
                    dragDrop
                );


                item.addEventListener(
                    "dragenter",
                    dragEnter
                );


                item.addEventListener(
                    "dragleave",
                    dragLeave
                );

            }
        );
    }

}

/* =====================================================
   NOTIFICACIONES PERSONALIZADAS
===================================================== */

function mostrarNotificacion(
    mensaje,
    tipo = "success"
) {

    const modal =
        document.getElementById(
            "modalNotificacion"
        );

    const icono =
        document.getElementById(
            "modalIcono"
        );

    const titulo =
        document.getElementById(
            "modalTitulo"
        );

    const texto =
        document.getElementById(
            "modalMensaje"
        );


    texto.textContent = mensaje;


    /*
       Configuración según el tipo
    */

    if (tipo === "success") {

        icono.textContent = "✓";

        titulo.textContent =
            "Operación realizada";

        icono.style.color =
            "#67e8f9";

        icono.style.borderColor =
            "rgba(34, 211, 238, 0.45)";

        icono.style.background =
            "rgba(34, 211, 238, 0.12)";

    }


    if (tipo === "error") {

        icono.textContent = "✕";

        titulo.textContent =
            "Ocurrió un error";

        icono.style.color =
            "#f87171";

        icono.style.borderColor =
            "rgba(248, 113, 113, 0.45)";

        icono.style.background =
            "rgba(248, 113, 113, 0.12)";

    }


    if (tipo === "warning") {

        icono.textContent = "!";

        titulo.textContent =
            "Atención";

        icono.style.color =
            "#facc15";

        icono.style.borderColor =
            "rgba(250, 204, 21, 0.45)";

        icono.style.background =
            "rgba(250, 204, 21, 0.12)";
    }


    modal.classList.add(
        "activo"
    );
}


/* Cerrar modal */

function cerrarNotificacion() {

    const modal =
        document.getElementById(
            "modalNotificacion"
        );

    modal.classList.remove(
        "activo"
    );
}


/* Evento botón Aceptar */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* ==============================
           CERRAR NOTIFICACIÓN
        ============================== */

        const btnCerrar =
            document.getElementById(
                "btnCerrarModal"
            );


        if (btnCerrar) {

            btnCerrar.addEventListener(
                "click",
                cerrarNotificacion
            );
        }


        /* ==============================
           CANCELAR ELIMINACIÓN
        ============================== */

        const btnCancelar =
            document.getElementById(
                "btnCancelarEliminar"
            );


        if (btnCancelar) {

            btnCancelar.addEventListener(
                "click",
                function () {

                    document
                        .getElementById(
                            "modalConfirmacion"
                        )
                        .classList
                        .remove(
                            "activo"
                        );

                }
            );
        }


        /* ==============================
           CONFIRMAR ELIMINACIÓN
        ============================== */

        const btnConfirmar =
            document.getElementById(
                "btnConfirmarEliminar"
            );


        if (btnConfirmar) {

            btnConfirmar.addEventListener(
                "click",
                confirmarEliminacion
            );
        }

    }
);