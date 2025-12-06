import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

// Obtener el canvas
const canvas = document.getElementById('model-viewer');
if (!canvas) {
    console.error('Canvas con id "model-viewer" no encontrado');
} else {
    // Escena
    const scene = new THREE.Scene();

    // Cámara
    const camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Iluminación - Luces blancas
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Luz direccional principal (frontal)
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    // Luz direccional secundaria (lateral)
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 3, 5);
    scene.add(directionalLight2);

    // Luz direccional superior
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(0, 10, 0);
    scene.add(directionalLight3);

    // Luz puntual blanca cerca del modelo
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Controles de órbita
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Bloquear zoom

    // Variable para guardar referencia al modelo
    let loadedModel = null;
    
    // Variables para animación de cámara
    let cameraInitialPos = { x: 0, y: 0, z: 5 };
    let cameraFinalPos = { x: 0, y: 0, z: 5 };
    let cameraAnimation = null;
    let isHovering = false;

    // Loader para modelos GLTF
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Función para cargar una imagen de fondo
    function setBackground(imagePath) {
        textureLoader.load(
            imagePath,
            (texture) => {
                scene.background = texture;
                // Ampliar la imagen un 30% (repeat menor = imagen más grande)
                // 1.0 / 1.3 = 0.769 para ampliar 30%
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(0.669, 0.669);
                // Centrar la imagen (un poco más arriba)
                texture.offset.set(0.115, 0.165);
                console.log('Imagen de fondo cargada:', imagePath);
            },
            undefined,
            (error) => {
                console.error('Error al cargar la imagen de fondo:', error);
            }
        );
    }

    // Función para cargar un skybox (cubemap)
    function setSkybox(px, nx, py, ny, pz, nz) {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([px, nx, py, ny, pz, nz]);
        scene.background = texture;
        console.log('Skybox cargado');
    }

    // Función para establecer un color de fondo
    function setBackgroundColor(color) {
        scene.background = new THREE.Color(color);
    }

    // Función para cargar un modelo
    function loadModel(modelPath) {
        loader.load(
            modelPath,
            (gltf) => {
                // Limpiar modelo anterior si existe
                const oldModel = scene.getObjectByName('loadedModel');
                if (oldModel) {
                    scene.remove(oldModel);
                }

                const model = gltf.scene;
                model.name = 'loadedModel';
                loadedModel = model; // Guardar referencia para rotación
                
                scene.add(model);
                
                // Calcular el bounding box para centrar el modelo
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // Escalar si es necesario (ajustar para que quepa en la vista)
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim; // Aumentado de 2 a 2.5 para hacer el modelo más grande
                model.scale.multiplyScalar(scale);
                
                // Recalcular el bounding box después de escalar
                box.setFromObject(model);
                const newCenter = box.getCenter(new THREE.Vector3());
                
                // Centrar el modelo en el origen (0, 0, 0)
                model.position.x = -newCenter.x;
                model.position.y = -newCenter.y;
                model.position.z = -newCenter.z;
                
                // Ajustar cámara para ver el modelo completo y centrado (más cerca)
                const scaledSize = box.getSize(new THREE.Vector3());
                const maxScaledDim = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
                const distance = maxScaledDim * 1.5; // Reducido de 2 a 1.5 para acercar la cámara
                
                // Posición inicial de la cámara (más lejos)
                const initialDistance = distance * 1.3;
                cameraInitialPos.x = initialDistance * 0.6;
                cameraInitialPos.y = initialDistance * 0.4;
                cameraInitialPos.z = initialDistance * 0.6;
                
                // Posición final de la cámara (más cerca)
                const finalDistance = distance * 0.7;
                cameraFinalPos.x = finalDistance * 0.6;
                cameraFinalPos.y = finalDistance * 0.4;
                cameraFinalPos.z = finalDistance * 0.6;
                
                // Establecer posición inicial
                camera.position.set(cameraInitialPos.x, cameraInitialPos.y, cameraInitialPos.z);
                controls.target.set(0, 0, 0);
                controls.update();
                
                // Agregar event listeners después de cargar el modelo
                setupHoverListeners();
                
                console.log('Modelo cargado exitosamente:', modelPath);
                console.log('Posición inicial:', cameraInitialPos);
                console.log('Posición final:', cameraFinalPos);
            },
            (progress) => {
                console.log('Cargando modelo...', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error al cargar el modelo:', error);
            }
        );
    }

    // Ajustar tamaño del canvas cuando cambia el tamaño de la ventana
    function handleResize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
    }
    window.addEventListener('resize', handleResize);

    // Loop de animación
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotar el modelo lentamente alrededor del eje Y
        if (loadedModel) {
            loadedModel.rotation.y += 0.005; // Rotación un poco más rápida
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Función para animar la cámara hacia adelante
    function animateCameraForward() {
        if (isHovering) return; // Ya está en hover
        isHovering = true;
        
        console.log('Animando hacia adelante');
        console.log('Posición actual:', camera.position);
        console.log('Posición final:', cameraFinalPos);
        
        if (cameraAnimation) {
            cameraAnimation.kill();
        }
        // Deshabilitar controles completamente durante la animación
        controls.enabled = false;
        
        // Crear objeto para animar
        const cameraPos = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        
        cameraAnimation = gsap.to(cameraPos, {
            x: cameraFinalPos.x,
            y: cameraFinalPos.y,
            z: cameraFinalPos.z,
            duration: 1,
            ease: "elastic.out(0.5, 0.2)",
            onUpdate: () => {
                camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
                controls.target.set(0, 0, 0);
                controls.update();
            },
            onComplete: () => {
                controls.enabled = true;
                console.log('Animación hacia adelante completada');
            }
        });
    }

    // Función para animar la cámara hacia atrás
    function animateCameraBackward() {
        if (!isHovering) return; // Ya está fuera
        isHovering = false;
        
        console.log('Animando hacia atrás');
        console.log('Posición actual:', camera.position);
        console.log('Posición inicial:', cameraInitialPos);
        
        if (cameraAnimation) {
            cameraAnimation.kill();
        }
        // Deshabilitar controles completamente durante la animación
        controls.enabled = false;
        
        // Crear objeto para animar
        const cameraPos = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        
        cameraAnimation = gsap.to(cameraPos, {
            x: cameraInitialPos.x,
            y: cameraInitialPos.y,
            z: cameraInitialPos.z,
            duration: 0.8,
            ease: "elastic.out(0.5, 0.2)",
            onUpdate: () => {
                camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
                controls.target.set(0, 0, 0);
                controls.update();
            },
            onComplete: () => {
                controls.enabled = true;
                console.log('Animación hacia atrás completada');
            }
        });
    }

    // Función para configurar los event listeners de hover
    function setupHoverListeners() {
        // Usar el wrapper del modelo en lugar del canvas
        const modelWrapper = document.getElementById('modelWrapper');
        
        // Agregar listeners al wrapper
        if (modelWrapper) {
            modelWrapper.addEventListener('mouseenter', (e) => {
                console.log('Mouse enter en wrapper');
                animateCameraForward();
            });
            modelWrapper.addEventListener('mouseleave', (e) => {
                console.log('Mouse leave en wrapper');
                animateCameraBackward();
            });
        }
        
        // También agregar al canvas directamente
        if (canvas) {
            canvas.addEventListener('mouseenter', (e) => {
                console.log('Mouse enter en canvas');
                animateCameraForward();
            });
            canvas.addEventListener('mouseleave', (e) => {
                console.log('Mouse leave en canvas');
                animateCameraBackward();
            });
        }
        
        console.log('Event listeners de hover configurados');
    }

    // Cargar modelo por defecto (puedes cambiar la ruta)
    // Ejemplos de rutas disponibles:
    // '/models/Duck/glTF/Duck.gltf'
    // '/models/Fox/glTF/Fox.gltf'
    // '/models/f1/scene.gltf'
    // '/models/nokia/source/nokian81.gltf'
    
    loadModel('/models/nokia/source/nokian81.gltf');

    // Cargar imagen de fondo interactiva
    setBackground('/imgfondo.png');

    // Exportar funciones para usar desde fuera
    window.loadGLTFModel = loadModel;
    window.setBackground = setBackground;
    window.setSkybox = setSkybox;
    window.setBackgroundColor = setBackgroundColor;
}

