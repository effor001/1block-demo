import './style.css'
import * as THREE from 'three'
import {
	OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js'
import {
	GUI
} from 'three/examples/jsm/libs/dat.gui.module.js'
import {
	GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
	DRACOLoader
} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {
	EffectComposer
} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {
	RenderPass
} from 'three/examples/jsm/postprocessing/RenderPass.js'

import {
	ShaderPass
} from 'three/examples/jsm/postprocessing/ShaderPass.js'
import {
	 SAOPass 
	} from 'three/examples/jsm/postprocessing/SAOPass.js'
import {
	RGBShiftShader
} from 'three/examples/jsm/shaders/RGBShiftShader.js'

import {
	SMAAPass
} from 'three/examples/jsm/postprocessing/SMAAPass.js'
import {
	UnrealBloomPass
} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import {
	Raycaster,
	LinearFilter,
	RGBAFormat,
	AdditiveBlending,
	MultiplyBlending,
} from 'three'
import {
	gsap
} from "gsap";

import Stats from 'stats.js'
import homeBtn0 from '../assets/image/home-btn.png'
import helpBtn0 from '../assets/image/help-btn.png'

// home btn
let homeBtn = document.createElement('img')
homeBtn.src = homeBtn0
document.getElementById('home').appendChild(homeBtn)
// home btn
let helpBtn = document.createElement('img')
helpBtn.src = helpBtn0
document.getElementById('help').appendChild(helpBtn)
// // DebugUI

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

const gui = new GUI()
const debugObject = {}
//initial declarations

let sceneReady = false
// let  water, sun, loadingManager
let popUps = []
let mouse = new THREE.Vector2()
let prevTime = performance.now()
// const raycaster = new Raycaster()


const loadingBarElement = document.querySelector('.loading-bar')
// const testButton = document.getElementById("button1")
const objects = []


//mobile setting
let mobile
mobile = false;
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
if (isMobile) {
	mobile = true
} else {
	mobile = false
}

// screenSizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}


//points of interest

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene();
const cubeTextureLoader = new THREE.CubeTextureLoader()
//fog


const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 10, 20000);
camera.position.set(0, 10, 30)
camera.lookAt(new THREE.Vector3(0, 0, 0))
scene.add(camera)
//

const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true
});
renderer.shadowMap.enabled = false
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = false
renderer.outputEncoding = THREE.LinearEncoding

renderer.toneMappingExposure = 1
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);


//  Update all materials
 
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

//postprocessing
let RenderTargetClass = null

if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
	RenderTargetClass = THREE.WebGLMultisampleRenderTarget

} else {
	RenderTargetClass = THREE.WebGLRenderTarget
}

const renderTaeget = new RenderTargetClass(
	800,
	600, {
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		format: RGBAFormat,
		encoding: THREE.sRGBEncoding
	}
)
const effectComposer = new EffectComposer(renderer, renderTaeget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)


const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

// const bokehPass = new BokehPass(scene, camera, {
// 	focus: 500.0,
// 	aperture: 1.0,
// 	maxblur: 0,
// 	width: sizes.width,
// 	height: sizes.height
// })
// bokehPass.renderToScreen = true
// bokehPass.needsSwap = true;
// gui.add(bokehPass, 'enabled').name('bokehpassenabled')
// gui.add(bokehPass.uniforms.maxblur, 'value').min(0).max(1).step(.0001).name('maxblur')
// effectComposer.addPass(bokehPass)

const saoPass = new SAOPass(scene, camera, false, true)
saoPass.enabled=false;
saoPass.params.saoIntensity=0.00001;
effectComposer.addPass(saoPass);
gui.add(saoPass, 'enabled').name('SAOpassenabled')
gui.add( saoPass.params, 'output', {
	'Beauty': SAOPass.OUTPUT.Beauty,
	'Beauty+SAO': SAOPass.OUTPUT.Default,
	'SAO': SAOPass.OUTPUT.SAO,
	'Depth': SAOPass.OUTPUT.Depth,
	'Normal': SAOPass.OUTPUT.Normal
} ).onChange( function ( value ) {

	saoPass.params.output = parseInt( value );
	

} );
gui.add( saoPass.params, 'saoBias', - 1, 1 );
gui.add( saoPass.params, 'saoIntensity', 0, 0.0001 );
gui.add( saoPass.params, 'saoScale', 0, 10 );
gui.add( saoPass.params, 'saoKernelRadius', 1, 100 );
gui.add( saoPass.params, 'saoMinResolution', 0, 1 );
gui.add( saoPass.params, 'saoBlur' );
gui.add( saoPass.params, 'saoBlurRadius', 0, 200 );
gui.add( saoPass.params, 'saoBlurStdDev', 0.5, 150 );
gui.add( saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.1 );


// const filmPass = new FilmPass(
// 	0,
// 	0,
// 	0,
// 	false,
// );
// gui.add(filmPass, 'enabled').name('filmpass enabled')
// gui.add(filmPass.uniforms.grayscale, 'value').name('grayscale')
// gui.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity')
// gui.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity')
// gui.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count')
// effectComposer.addPass(filmPass);


// const rgbShiftPass = new ShaderPass(RGBShiftShader)
// rgbShiftPass.enabled = false
// effectComposer.addPass(rgbShiftPass)

const unrealBloomPass = new UnrealBloomPass()

unrealBloomPass.strength = .15
unrealBloomPass.radius = 2
unrealBloomPass.threshold = .334
effectComposer.addPass(unrealBloomPass)


gui.add(unrealBloomPass, 'enabled').name('unrealBloomPass enabled')

gui.add(unrealBloomPass, 'strength').min(0).max(2).step(.001)
gui.add(unrealBloomPass, 'radius').min(0).max(2).step(.001)
gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(.001)

// //Tint pass
// const TintShader = {
// 	precision: 'lowp',
// 	uniforms: {
// 		tDiffuse: {
// 			value: null
// 		},
// 		uTint: {
// 			value: null
// 		}
// 	},
// 	vertexShader: `
// 	varying vec2 vUv;

// 	void main()
// 	{
// 		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// 		vUv =uv;
// 	}
// 	`,
// 	fragmentShader: `
// 	uniform sampler2D tDiffuse;
// 	uniform vec3 uTint;

// 	varying vec2 vUv;

// 	void main()
// 	{
// 		vec4 color = texture2D(tDiffuse,vUv);
// 		color.rgb += uTint;
// 		gl_FragColor = color;
// 	}
// 	`
// }

// const tintPass = new ShaderPass(TintShader)
// tintPass.material.uniforms.uTint.value = new THREE.Vector3(0.101, -0.029, -0.007)
// effectComposer.addPass(tintPass)


// gui.add(tintPass.material.uniforms.uTint.value, 'x').min(-1).max(1).step(0.001).name('red')
// gui.add(tintPass.material.uniforms.uTint.value, 'y').min(-1).max(1).step(0.001).name('green')
// gui.add(tintPass.material.uniforms.uTint.value, 'z').min(-1).max(1).step(0.001).name('blue')

//antialias
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
	const smaaPass = new SMAAPass()
	effectComposer.addPass(smaaPass)
}

//overlay
const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
	transparent: true,
	uniforms: {
		uAlpha: {
			value: 1
		}
	},
	vertexShader: `
			void main()
			{
				gl_Position =  gl_Position = vec4(position, 1.0);
			}
		`,
	fragmentShader: `
			uniform float uAlpha;
			void main()
			{
				gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
			}
		`
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Loaders
 */

const loadingManager = new THREE.LoadingManager(
	() => {
		window.setTimeout(() => {
				gsap.to(overlayMaterial.uniforms.uAlpha, {
					duration: 3,
					value: 0,
					delay: 1
				})
				loadingBarElement.classList.add('ended')
				loadingBarElement.style.transform = ''
			}, 500),
			window.setTimeout(() => {
				sceneReady = true
			}, 2000)
	},

	// Progress
	(itemUrl, itemsLoaded, itemsTotal) => {
		const progressRatio = itemsLoaded / itemsTotal
		loadingBarElement.style.transform = `scaleX(${progressRatio})`
	}
)
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)



// const sun = new THREE.Vector3()

// // Water

// const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

// const water = new Water(
// 	waterGeometry, {
// 		textureWidth: 512,
// 		textureHeight: 512,
// 		waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

// 			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

// 		}),
// 		sunDirection: new THREE.Vector3(),
// 		sunColor: 0xffffff,
// 		waterColor: 0x001e0f,
// 		distortionScale: 5.8,
// 		fog: scene.fog !== undefined
// 	}
// );

// water.rotation.x = -Math.PI / 2;

// scene.add(water)

// Skybox

// const sky = new Sky()
// sky.scale.setScalar(10000)
// scene.add(sky);

// const skyUniforms = sky.material.uniforms

// skyUniforms['turbidity'].value = 10
// skyUniforms['rayleigh'].value = 2;
// skyUniforms['mieCoefficient'].value = 0.01
// skyUniforms['mieDirectionalG'].value = 0.8

// let parameters = {
// 	// elevation: 42,
// 	// azimuth: 16.6
// 	// // 夜
// 	elevation: 0.5,
// 	azimuth: -138.7
// };

// const pmremGenerator = new THREE.PMREMGenerator(renderer)

// function updateSun() {

// 	const phi = THREE.MathUtils.degToRad(90 - parameters.elevation)
// 	const theta = THREE.MathUtils.degToRad(parameters.azimuth)

// 	sun.setFromSphericalCoords(1, phi, theta)

// 	sky.material.uniforms['sunPosition'].value.copy(sun)
// 	water.material.uniforms['sunDirection'].value.copy(sun).normalize()

// 	scene.environment = pmremGenerator.fromScene(sky).texture;

// }

// updateSun();

// const interactionManager = new InteractionManager(
// 	renderer,
// 	camera,
// 	canvas
// );

// const point0 = document.querySelector('.point-0')
// const point1 = document.querySelector('.point-1')
// const point2 = document.querySelector('.point-2')

// const invgeometry = new THREE.PlaneBufferGeometry(200, 200)
// const invmaterial = new THREE.MeshBasicMaterial({
// 	color: 0xdd7279,
// 	wireframe: true,
// 	visible: false


// });



// const invPlane = new THREE.Mesh(invgeometry, invmaterial)
// invPlane.position.set(0, 20, 50)
// invPlane.rotation.y = .15 //正面に
// scene.add(invPlane)

// const invPlane2 = new THREE.Mesh(invgeometry, invmaterial)
// invPlane2.position.set(0, 20, 0)
// invPlane2.rotation.y = Math.PI * 0.5 + .15

// scene.add(invPlane2)


//textures
// const textureLoader = new THREE.TextureLoader()
// const colorTexture = textureLoader.load('/textures/icon2.jpg')
// const bumpTexture = textureLoader.load('/textures/bump.jpg')
// const normalTexture = textureLoader.load('/textures/normal.jpg')

// const alphaTexture = textureLoader.load('/textures/alpha.jpg')

// const geometry = new THREE.CylinderGeometry(3, 3, .2, 32)
// const material = new THREE.MeshStandardMaterial({
// 	map: colorTexture,
// 	bumpMap: bumpTexture,
// 	alphaMap:bumpTexture,
// 	normalMap: normalTexture,
// 	blending:AdditiveBlending,

// })

//右奥



// const cube = new THREE.Mesh(geometry, material)
// cube.position.set(20, 40, -15)
// cube.rotation.x = Math.PI / 2
// cube.castShadow = false

// cube.addEventListener("mousedown", (event) => {
// 	cube.scale.set(1.5, 1.5, 1.5)
// 	var aabb = new THREE.Box3().setFromObject(cube)
// 	var center = aabb.getCenter(new THREE.Vector3())
// 	var size = aabb.getSize(new THREE.Vector3())

// 	gsap.to(controls.target, {
// 		duration: 0.5,
// 		ease: "power4.in",
// 		x: center.x+10,
// 		y: center.y +10,
// 		z: center.z,
// 		onUpdate: function () {
// 			controls.update()
// 		}
// 	});
// 	gsap.to(camera.position, {
// 		// delay: 0.6,
// 		duration: 2,
// 		ease: "power4.in",
// 		// ease: "power2.out",
// 		x: center.x + size.x,
// 		y: center.y,
// 		z: center.z + size.z * 20,
// 		onUpdate: function () {
// 			camera.lookAt(center);
// 			controls.enablePan = false
// 			controls.update()
// 			// point0.classList.add('visible')
// 		},
// 		onComplete: function () {
// 			cube.scale.set(1, 1, 1)
// 			controls.update()
// 		}
// 	});
// 	// cube.visible = false
// })
// popUps.push(cube)
// scene.add(cube);
// interactionManager.add(cube);
// interactionManager.update();




// //左奥
// const cube2 = new THREE.Mesh(geometry, material)
// cube2.position.set(-35, 50, -20)
// cube2.rotation.x = Math.PI / 2
// cube2.castShadow = false
// cube2.addEventListener("mousedown", (event) => {
// 	cube2.scale.set(1.5, 1.5, 1.5)
// 	var aabb = new THREE.Box3().setFromObject(cube2);
// 	var center = aabb.getCenter(new THREE.Vector3());
// 	var size = aabb.getSize(new THREE.Vector3());

// 	gsap.to(controls.target, {
// 		duration: 0.5,
// 		ease: "power4.in",
// 		x: center.x,
// 		y: center.y,
// 		z: center.z,
// 		onUpdate: function () {
// 			controls.update();
// 		}
// 	});
// 	gsap.to(camera.position, {
// 		// delay: 0.6,
// 		duration: 2,
// 		ease: "power2.in",
// 		// ease: "power2.out",
// 		x: center.x +size.x *6,
// 		y: center.y,
// 		z: center.z + size.z * 65,
// 		onUpdate: function () {
// 			camera.lookAt(center)
// 			controls.enablePan = false
// 			controls.update()
// 		},
// 		onComplete: function () {
// 			cube2.scale.set(1, 1, 1)
// 			controls.update()
// 		}
// 	});

// })
// popUps.push(cube2)
// scene.add(cube2)
// interactionManager.add(cube2)
// interactionManager.update()


// //大
// const cube3 = new THREE.Mesh(geometry, material)
// cube3.position.set(60, 30, 40)
// cube3.rotation.x = Math.PI / 2
// cube3.castShadow = false
// cube3.addEventListener("mousedown", (event) => {
// 	cube3.scale.set(1.5, 1.5, 1.5)
// 	var aabb = new THREE.Box3().setFromObject(cube3)
// 	var center = aabb.getCenter(new THREE.Vector3())
// 	var size = aabb.getSize(new THREE.Vector3())

// 	gsap.to(controls.target, {
// 		duration: 0.5,
// 		ease: "power4.in",
// 		x: center.x,
// 		y: center.y,
// 		z: center.z,
// 		onUpdate: function () {
// 			controls.update()
// 		}
// 	});
// 	gsap.to(camera.position, {
// 		// delay: 0.6,
// 		duration: 2,
// 		ease: "power2.in",
// 		// ease: "power2.out",
// 		x: center.x + size.x * 8,
// 		y: center.y - size.y * 4,
// 		z: center.z + size.z * 8,
// 		onUpdate: function () {
// 			camera.lookAt(center);
// 			controls.enablePan = false
// 			controls.update();
// 			// point2.classList.add('visible')
// 		},
// 		onComplete: function () {
// 			cube3.scale.set(1, 1, 1)
// 			controls.update()
// 		}
// 	});

// })
// popUps.push(cube3)
// scene.add(cube3)
// interactionManager.add(cube3)
// interactionManager.update()

// //ステージ
// const cube4 = new THREE.Mesh(geometry, material)
// cube4.position.set(-40, 40, 65)
// cube4.rotation.x = Math.PI / 2

// cube4.castShadow = false
// cube4.addEventListener("mousedown", (event) => {
// 	cube4.scale.set(1.5, 1.5, 1.5)
// 	var aabb = new THREE.Box3().setFromObject(cube4)
// 	var center = aabb.getCenter(new THREE.Vector3())
// 	var size = aabb.getSize(new THREE.Vector3())

// 	gsap.to(controls.target, {
// 		duration: 0.5,
// 		ease: "power4.in",
// 		x: center.x,
// 		y: center.y,
// 		z: center.z,
// 		onUpdate: function () {
// 			controls.update();
// 		}
// 	});
// 	gsap.to(camera.position, {
// 		// delay: 0.6,
// 		duration: 2,
// 		ease: "power4.in",
// 		// ease: "power2.out",
// 		x: center.x - size.x * 10,
// 		y: center.y,
// 		z: center.z + size.z * 14,
// 		onUpdate: function () {
// 			camera.lookAt(center)
// 			controls.enablePan = false
// 			controls.update()
// 		},
// 		onComplete: function () {
// 			cube4.scale.set(1, 1, 1)
// 			controls.update()
// 		}
// 	});

// })
// popUps.push(cube4)
// scene.add(cube4)
// interactionManager.add(cube4)
// interactionManager.update()



// console.log(popUps)
// const backBtn = document.querySelector('.home')
// backBtn.addEventListener('mousedown', (event) => {
// 	location.reload()
// 	// camera.position.set(30, 90, 200)
// 	// controls.target = new THREE.Vector3(0, 0, 0)
// 	// controls.target.normalize()
// 	// camera.lookAt(0,0,0)
// 	// controls.enablePan = true
// 	// controls.update()
// //   reloadファンクションかく
// })




//model


gltfLoader.load(
	'/models/World_ForGLTF-2.glb',
	(gltf) => {
		const model = gltf.scene
		model.castShadow = true
		model.receiveShadow = true
		model.scale.set(7, 7, 7)
		model.position.set(-5, -5, -30)
	
	  
	   
		// //mobileの場合モデルを少し小さく表示
		// if (isMobile == true) {
		// 	model.scale.set(6, 6, 6)
		// }
		// Get existing `uv` data array
		model.traverse((child) => {
			if (child.isMesh) {
				objects.push(child)
				child.castShadow = true
				child.receiveShadow = true
				child.reflectivity = 1.0

const uv1Array = child.geometry.getAttribute("uv").array;
console.log(child.uv1Array)
// Use this array to create new attribute named `uv2`
child.geometry.setAttribute( 'uv2', new THREE.BufferAttribute( uv1Array, 2 ) );
				// console.log(child)
			}
			// stage = gltf.scene.getObjectByName( "Stage9", true );
			// stage.material = new THREE.MeshBasicMaterial
			// stage.material.color.setHex(0x00ffff)


		})

		scene.add(model)
		// updateAllMaterials()

	},
	console.log(objects)

)



// modelRotationFunction
var rotateModel = function () {
	requestAnimationFrame(rotateModel)
	objects.rotation.x += 0.1
}
// rotatefunction

var rotateModel = function () {
	requestAnimationFrame(rotateModel)
	model.rotation.x += 0.1
};


// const points = [{
// 		position: new THREE.Vector3(18, 70, -50),
// 		element: document.querySelector('.point-0')
// 	},
// 	{
// 		position: new THREE.Vector3(35, 65, -40),
// 		element: document.querySelector('.point-1')
// 	},
// 	{
// 		position: new THREE.Vector3(58, 60, -30),
// 		element: document.querySelector('.point-2')
// 	}

// ]

//light

// keylight
// //夜
// const mainLight = new THREE.DirectionalLight(0xA49ac2, 1.4777);
// // // 昼
// // const mainLight = new THREE.DirectionalLight(0x17B7FF, 8);
// mainLight.position.set(0, 60, 0)
// mainLight.shadow.mapSize.set(1024, 1024)
// mainLight.shadow.normalBias = 0.05
// mainLight.castShadow = true
// scene.add(mainLight);
// const helper = new THREE.DirectionalLightHelper(mainLight, 5);
// scene.add(helper);
// gui.add(mainLight, 'intensity').min(0).max(20).step(0.001).name('mainlightIntensity')

// filllight
// 夜
const Light1 = new THREE.DirectionalLight(0xFFDEC3, 5.6);
// const Light1 = new THREE.DirectionalLight(0xFFB717, 10);
Light1.position.set(0, 50, 80)
Light1.shadow.mapSize.set(1024, 1024)
Light1.shadow.normalBias = 0.05
Light1.castShadow = true
scene.add(Light1)
// const helper1 = new THREE.DirectionalLightHelper(Light1, 5);
// scene.add(helper1);


gui.add(Light1, 'intensity').min(0).max(20).step(0.001).name('fillLightIntensity')

// rimlight
// 夜
const Light2 = new THREE.DirectionalLight(0xDAF9FF, 0.6)
// const Light2 = new THREE.DirectionalLight(0xFDF7A4, 20);
Light2.position.set(-60, 40, -180)
Light2.shadow.mapSize.set(1024, 1024)
Light2.shadow.normalBias = 0.05
Light2.castShadow = false
scene.add(Light2)
// const helper3 = new THREE.DirectionalLightHelper(Light2, 5); scene.add(helper3);

gui.add(Light2, 'intensity').min(0).max(20).step(0.001).name('rimlightIntensity')

const controls = new OrbitControls(camera, canvas)
controls.maxPolarAngle = Math.PI * 0.395

controls.minDistance = 0.0
controls.maxDistance = 250.0
controls.minAzimuthAngle = -Math.PI / 4 // radians
controls.maxAzimuthAngle = Math.PI / 4 // radians
controls.enableDamping = true

controls.dampingFactor = 0.07
controls.rotateSpeed = 1
controls.update();


//

// stats = new Stats();
// container.appendChild( stats.dom );

// GUI

// const folderSky = gui.addFolder('Sky')
// folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun)
// folderSky.add(parameters, 'azimuth', -180, 180, 0.1).onChange(updateSun)
// folderSky.open()

// const waterUniforms = water.material.uniforms

// const folderWater = gui.addFolder('Water')
// folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale')
// folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size')
// folderWater.open()

//

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/px.png',
    '/textures/nx.png',
    '/textures/py.png',
    '/textures/ny.png',
    '/textures/pz.png',
    '/textures/nz.png'
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

debugObject.envMapIntensity = 5
gui.add(debugObject, 'envMapIntensity').min(0).max(10).step(0.001).onChange(updateAllMaterials)



window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

	//Update effect Composer
	effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	effectComposer.setSize(sizes.width, sizes.height)
})

// console.log(popUps)

const animate = () => {

	const clock = new THREE.Clock()
	const elapsedTime = clock.getElapsedTime()

	const time = performance.now() * 0.001

	// water.material.uniforms['time'].value += 1.0 / 60.0
	prevTime = time
	// effectComposer.render()


	// Update controls
	controls.update()



	// // Update points only when the scene is ready
	// if (sceneReady) {
	// 	// Go through each point
	// 	for (const point of points) {
	// 		// Get 2D screen position
	// 		const screenPosition = point.position.clone()
	// 		screenPosition.project(camera)

	// 		// Set the raycaster
	// 		raycaster.setFromCamera(screenPosition, camera)
	// 		const intersects = raycaster.intersectObjects(scene.children, true)

	// 		// No intersect found
	// 		if (intersects.length === 0) {
	// 			// Show
	// 			point.element.classList.add('visible')
	// 		}

	// 		// Intersect found
	// 		else {
	// 			// Get the distance of the intersection and the distance of the point
	// 			const intersectionDistance = intersects[0].distance
	// 			const pointDistance = point.position.distanceTo(camera.position)

	// 			// Intersection is close than the point
	// 			if (intersectionDistance < pointDistance) {
	// 				// Hide
	// 				point.element.classList.remove('visible')
	// 			}
	// 			// Intersection is further than the point
	// 			else {
	// 				// Show
	// 				point.element.classList.add('visible')
	// 			}
	// 		}

	// 		const translateX = screenPosition.x * sizes.width * 0.5
	// 		const translateY = -screenPosition.y * sizes.height * 0.5
	// 		point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
	// 	}

	// 	for (let i = 0; i < popUps.length; i++) {
	// 		popUps[i].rotation.z += time / 10000
	// 	}
	// }

	stats.begin()
	stats.end()

	renderer.render(scene, camera)
	effectComposer.render()
	window.requestAnimationFrame(animate)
}
animate()