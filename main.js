var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(
  45, window.innerWidth / window.innerHeight, 0.1, 1000
);

// create a render and set the size
var webGLRenderer = new THREE.WebGLRenderer();
webGLRenderer.setClearColor(0xffffff, 1);
webGLRenderer.setSize(window.innerWidth, window.innerHeight);

var controls = new THREE.OrbitControls( camera, webGLRenderer.domElement );

// position and point the camera to the center of the scene
camera.position.x = -30;
camera.position.y = 40;
camera.position.z = 50;
camera.lookAt(new THREE.Vector3(10, 0, 0));

// add the output of the renderer to the html element
document.body.appendChild(webGLRenderer.domElement);

var meshMaterial; 

function createMesh(geom) {
  
  if(geom == null)
    alert('geom is null');
  
  // assign two materials
  var meshMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff
  });
  
  // create a line mesh
  var mesh = THREE.Line(
    geom, meshMaterial
 );

  return mesh;
}

var Wave = function(){
  this.frequency = 4;
  this.lambda = 80;
  this.amplitudeS1 = 10;
  this.amplitudeS2 = 10;
  // 0 or half lambda
  this.phaseDifference = 0;
  // distance between sources
  this.d = 10;
};

var wave = new Wave();

var halfD;

// viewpoint
var distance;

// rotational constants
var lambdaOverTwoPi;
var frequencyTimesTwoPi;

// animation loop
var loopTimeout;
var loopWait = 15; // ms

// time
var t;
var dt;

// math surface
var surface, surfaceMesh;

var s1, s2;

var surfaceXMin = -200;
var surfaceXMax =  200;
var surfaceYMin = -200;
var surfaceYMax =  200;

var surfaceDx = 10;
var surfaceDy = 10;

var twoPi = 2 * Math.PI;

initialize();

function initialize()
{
  var gui = new dat.GUI();
   
  var setLambda = gui.add(wave, 'lambda', 20, 200);
  setLambda.onChange(function(value)
  {
    wave.lambda = value;
    lambdaOverTwoPi = wave.lambda / twoPi;
  });

  var setFrequency = gui.add(wave, 'frequency', 0.5, 4);
  setFrequency.onChange(function(value)
  {
    wave.frequency = value;
	  frequencyTimesTwoPi = wave.frequency * twoPi;
  });

	gui.add(wave, 'amplitudeS1', 0, 20);
  gui.add(wave, 'amplitudeS2', 0, 20);  
  gui.add(wave, 'phaseDifference', 0, wave.lambda).step(wave.lambda / 8);  
  
  var setD = gui.add(wave, 'd', 0, 400);
  setD.onChange(function(value)
  {
    wave.d = value;
    halfD = wave.d /2;

    s1.position.x = -halfD;
    s2.position.x = halfD;
   
      surfaceInitialize();
  })
  
	halfD = wave.d /2;
	
  drawSources();
  
	s1.position.x = -halfD;
	s1.position.y = -200;
	s2.position.x = halfD;
	s2.position.y = -200;

	surfaceCreate();
	surfaceInitialize();

	t  = 0;
	dt = 0.01;
	
	lambdaOverTwoPi     = wave.lambda / twoPi;
	frequencyTimesTwoPi = wave.frequency * twoPi;
	
	//loop();
}

function surfaceCreate()
{
	var column, row;
	
	surface = new Array();
	column = 0;
	
	for(var x = surfaceXMin; x <= surfaceXMax; x += surfaceDx)
	{
		surface[column] = new Array();	
		row = 0;
		
		for(var y = surfaceYMin; y <= surfaceYMax; y += surfaceDy)
		{
			surface[column][row] = new THREE.Vector3(0, 0, 0);
			
			row++;
		}
		
		column++;
	}	
}

function r2D(x0, y0, x1, y1)
{
	var dx = x1 - x0;
	var dy = y1 - y0;
	
	return Math.sqrt(dx*dx + dy*dy);
}

function surfaceInitialize()
{
	var column, row, x, y, z, point;
	
	z = 0;
	column = 0;
	
	for(x = surfaceXMin; x <= surfaceXMax; x += surfaceDx)
	{
		row = 0;
		
		for(y = surfaceYMin; y <= surfaceYMax; y += surfaceDy)
		{
			var point = surface[column][row];
			
			point.x  = x;
			point.y  = y;
			point.z  = z;
			point.r1 = r2D(s1.position.x, s1.position.y, x, y);
			point.r2 = r2D(s2.position.x, s2.position.y, x, y);
      
			row++;
		}
		
		column++;
	}
  
  var surfaceGeometry = new THREE.Geometry(surface);
  surfaceMesh = createMesh(surfaceGeometry);
  setTimeout(function()
            {
    scene.add(surfaceMesh);
  }, 1000)
  
}

function loop()
{
	updateSources();
	drawSources();
	updateMesh();
	drawMesh();

	// tic-toc
	t += dt;

	if(t > 1/wave.frequency)
	{
		t -= 1/wave.frequency;
	}

	loopTimeout = setTimeout(loop, loopWait);
}

function updateSources()
{
	s1.position.z = wave.amplitudeS1 * Math.sin(frequencyTimesTwoPi * t);
	s2.position.z = wave.amplitudeS2 * Math.sin((frequencyTimesTwoPi * t) + (wave.phaseDifference / lambdaOverTwoPi));
}

function drawSources()
{
	s1 = new THREE.Mesh( new THREE.CubeGeometry( 10, 10, 10 ), new THREE.MeshNormalMaterial() );
  s2 = new THREE.Mesh( new THREE.CubeGeometry( 10, 10, 10 ), new THREE.MeshNormalMaterial() );
}

function setupSky()
{
  var urlPrefix = "images/Bridge2/";
var urls = [ urlPrefix + "posx.jpg", urlPrefix + "negx.jpg",
    urlPrefix + "posy.jpg", urlPrefix + "negy.jpg",
    urlPrefix + "posz.jpg", urlPrefix + "negz.jpg" ];
var textureCube = THREE.ImageUtils.loadTextureCube( urls );
  
  var shader = THREE.ShaderUtils.lib["cube"];
var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
uniforms['tCube'].texture= textureCube;   // textureCube has been init before
var material = new THREE.MeshShaderMaterial({
    fragmentShader    : shader.fragmentShader,
    vertexShader  : shader.vertexShader,
    uniforms  : uniforms
});
  
  // build the skybox Mesh 
skyboxMesh    = new THREE.Mesh( new THREE.CubeGeometry( 100000, 100000, 100000, 1, 1, 1, null, true ), material );
// add it to the scene
scene.addObject( skyboxMesh );
}

function updateMesh()
{
	var numColumns = surface[0].length;
	var numRows    = surface.length;
	
	var column, row, r1, r2;
	
	var point;
	
	for(column = 0; column < numColumns; column++)
	{
		for(row = 0; row < numRows; row++)
		{
			r1 = (point = surface[column][row]).r1;
			r2 = point.r2
			point.z = functionOutput(r1, r2, t);
		}
	}
}

function functionOutput(r1, r2, t)
{
	return wave.amplitudeS1 * Math.sin((frequencyTimesTwoPi * t) - (r1 / lambdaOverTwoPi)) 
		+ wave.amplitudeS2 * Math.sin((frequencyTimesTwoPi * t) - ((r2 - wave.phaseDifference) / lambdaOverTwoPi));
}

function drawMesh()
{
	var numColumns = surface[0].length;
	var numRows    = surface.length;
  
  var geometry = 
	xyzGraph.setLineThickness(2);
	xyzGraph.setLineColor('blue');
	xyzGraph.drawLineSegment(-200, -200, 0,  200, -200, 0);
	xyzGraph.drawLineSegment( 200, -200, 0,  200,  200, 0);
	xyzGraph.drawLineSegment( 200,  200, 0, -200,  200, 0);
	xyzGraph.drawLineSegment(-200,  200, 0, -200, -200, 0);
	
	xyzGraph.setLineColor('yellow');

	var column, row, x1, y1, z1, x2, y2, z2;
	
	var numColumnsMinus1 = numColumns - 1;
	var numRowsMinus1    = numRows - 1;
	
	var point;
	
	for(column = 0; column < numColumnsMinus1; column++)
	{
		for(row = 0; row < numRowsMinus1; row++)
		{
			x1 = (point = surface[column][row]).x;
			y1 = point.y;
			z1 = point.z;
			
			x2 = (point = surface[column + 1][row]).x;
			y2 = point.y;
			z2 = point.z;
			
			xyzGraph.drawLineSegment(x1, y1, z1, x2, y2, z2);
			
			x2 = (point = surface[column][row + 1]).x;
			y2 = point.y;
			z2 = point.z;
			
			xyzGraph.drawLineSegment(x1, y1, z1, x2, y2, z2);
		}
	}
	
	for(row = 0; row < numRowsMinus1; row++)
	{
		x1 = (point = surface[numColumnsMinus1][row]).x;
		y1 = point.y;
		z1 = point.z;
		
		x2 = (point = surface[numColumnsMinus1][row + 1]).x;
		y2 = point.y;
		z2 = point.z;
		
		xyzGraph.drawLineSegment(x1, y1, z1, x2, y2, z2);
	}
	
	for(column = 0; column < numColumnsMinus1; column++)
	{
		x1 = (point = surface[column][numRowsMinus1]).x;
		y1 = point.y;
		z1 = point.z;
		
		x2 = (point = surface[column + 1][numRowsMinus1]).x;
		y2 = point.y;
		z2 = point.z;
		
		xyzGraph.drawLineSegment(x1, y1, z1, x2, y2, z2);
	}
}
