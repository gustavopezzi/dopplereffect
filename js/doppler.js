///////////////////////////////////////////////////////////////////////////////
// Prerequisite code needed to set up FMOD object
///////////////////////////////////////////////////////////////////////////////
var FMOD = {};                       // FMOD global object which must be declared to enable 'main' and 'preRun' and then call the constructor function.
FMOD['preRun'] = prerun;             // Will be called before FMOD runs, but after the Emscripten runtime has initialized
FMOD['onRuntimeInitialized'] = main; // Called when the Emscripten runtime has initialized
FMOD['TOTAL_MEMORY'] = 64*1024*1024; // FMOD Heap defaults to 16mb which is enough for this project, but we are setting to 64mb
FMODModule(FMOD);                    // Calling the constructor function with our object

///////////////////////////////////////////////////////////////////////////////
// FMOD objects and variables
///////////////////////////////////////////////////////////////////////////////
var gSystem;                  // Global 'System' object which has the top level API functions. Sounds and channels are created from this.
var gSound = {};              // Array of sounds.
var gChannel = {};            // Array of channels. 1 for each sound.
var lastListenerPosition;     // Remember the previous listener position to calculate movement delta.
var lastEmitterPosition = {}; // Remember previous emitter positions to calculate movement deltas.
var gIOSInitialized  = false; // Boolean to avoid resetting FMOD on IOS every time screen is touched.

///////////////////////////////////////////////////////////////////////////////
// Simple error checking function for all FMOD return values
///////////////////////////////////////////////////////////////////////////////
function CHECK_RESULT(result) {
    if (result != FMOD.OK) {
        var msg = "Error!!! '" + FMOD.ErrorString(result) + "'";
        alert(msg);
        throw msg;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Called before FMOD runs but after the Emscripten runtime has initialized
// Call FMOD file preloading functions here to mount local files.
///////////////////////////////////////////////////////////////////////////////
function prerun() {
    var fileUrl = "./sounds/";
    var fileName;
    var folderName = "/";
    var canRead = true;
    var canWrite = false;

    fileName = ["engine.wav"];

    for (var count = 0; count < fileName.length; count++) {
        FMOD.FS_createPreloadedFile(folderName, fileName[count], fileUrl + fileName[count], canRead, canWrite);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Called when the Emscripten runtime has initialized
///////////////////////////////////////////////////////////////////////////////
function main() {
    // A temporary empty object to hold our system
    var systemOut = {};
    var result;

    console.log("Creating FMOD System object\n");

    // Create the system and check the result
    result = FMOD.System_Create(systemOut);
    CHECK_RESULT(result);

    console.log("Grabbing system object from temporary and storing it\n");

    // Take out our System object
    gSystem = systemOut.val;

    // Optional. Setting DSP Buffer size can affect latency and stability
    console.log("set DSP Buffer size.\n");
    result = gSystem.setDSPBufferSize(2048, 2);
    CHECK_RESULT(result);

    console.log("Initialize FMOD\n");

    // 1024 virtual channels
    result = gSystem.init(1024, FMOD.INIT_NORMAL, null);
    CHECK_RESULT(result);

    // Distancefactor. How many pixels in a meter? We can make something up, lets say 20. Only affects doppler.
    // For panning and volume, all units are relative so units dont matter. Doppler uses meters per second, so we need to define a meter.
    gSystem.set3DSettings(10.0, .05, 1.0);

    console.log("initialize Application\n");

    // Starting up your typical JavaScript application loop
    initApplication();

    // Set up iOS workaround.  iOS does not allow webaudio to start unless screen is touched.
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (iOS) {
        alert("WebAudio can only be started if the screen is touched. Touch the screen when the data has finished loading.");
        window.addEventListener('touchend', function () {
            if (!gIOSInitialized) {
                result = gSystem.setDriver(0);
                gIOSInitialized = true;
            }
        }, false);
    }

    // Set the framerate to 50 frames per second, or 20ms.
    console.log("Start game loop\n");

    window.setInterval(updateApplication, 20);

    return FMOD.OK;
}

///////////////////////////////////////////////////////////////////////////////
// Function called when pressed the play Sound button with parameter 0, 1 or 2
///////////////////////////////////////////////////////////////////////////////
function playSound(soundid) {
    var channelOut = {};
    var result = gSystem.playSound(gSound[parseInt(soundid)], null, false, channelOut);
    CHECK_RESULT(result);
    gChannel[soundid] = channelOut.val;
}

///////////////////////////////////////////////////////////////////////////////
// Function to set the 3d position of the listener or an channel (by name)
///////////////////////////////////////////////////////////////////////////////
function update3DPosition(objectname, pos, vel) {
    var forward = FMOD.VECTOR();
    var up = FMOD.VECTOR();

    forward.x = 0.0;
    forward.y = 0.0;
    forward.z = 1.0;

    up.x = 0.0;
    up.y = 1.0;
    up.z = 0.0;

    if (objectname == "listener") {
        result = gSystem.set3DListenerAttributes(0, pos, vel, forward, up);
        CHECK_RESULT(result);
    } else if (objectname == "emitter") {
        result = gChannel[0].set3DAttributes(pos, vel, null);
        CHECK_RESULT(result);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Called from main, does some application setup.
///////////////////////////////////////////////////////////////////////////////
function initApplication() {
    console.log("Loading sounds\n");

    // Create a sound that loops
    var soundOut = {};
    var result = gSystem.createSound("engine.wav", FMOD.LOOP_NORMAL | FMOD._3D, null, soundOut);
    CHECK_RESULT(result);
    gSound[0] = soundOut.val;

    // Our units are pixels, so lets scale the min and max distance to pixels as units.
    result = gSound[0].set3DMinMaxDistance(100.0, 100000.0);
    CHECK_RESULT(result);

    playSound(0);

    lastListenerPosition = FMOD.VECTOR();
    lastEmitterPosition[0] = FMOD.VECTOR();

    lastListenerPosition.x = 0;
    lastListenerPosition.y = 0;
    lastListenerPosition.z = 0;

    lastEmitterPosition[0].x = 0;
    lastEmitterPosition[0].y = 0;
    lastEmitterPosition[0].z = 0;
}

function setCanvasVisible(visible) {
    var visibilityValue = visible ? "block" : "none";
    $("#canvas").css("display", visibilityValue);
    $("#canvas").focus();
}

///////////////////////////////////////////////////////////////////////////////
// Prints out information, about the system, and calles System::udpate()
///////////////////////////////////////////////////////////////////////////////
function updateApplication() {
    var dsp = {};
    var stream = {};
    var update = {};
    var total = {};
    var result;

    result = gSystem.getCPUUsage(dsp, stream, null, update, total);
    CHECK_RESULT(result);

    var channelsplaying = {};
    result = gSystem.getChannelsPlaying(channelsplaying, null);
    CHECK_RESULT(result);

    setCanvasVisible(true);

    document.getElementById("info-dsp").innerHTML =
        "Channels Playing = " + channelsplaying.val +
        " : CPU = dsp " + dsp.val.toFixed(2) +
        "% stream " + stream.val.toFixed(2) +
        "% update " + update.val.toFixed(2) +
        "% total " + total.val.toFixed(2) + "%";

    var numbuffers = {};
    var buffersize = {};
    result = gSystem.getDSPBufferSize(buffersize, numbuffers);
    CHECK_RESULT(result)

    var rate = {};
    result = gSystem.getSoftwareFormat(rate, null, null);
    CHECK_RESULT(result);

    var sysrate = {};
    result = gSystem.getDriverInfo(0, null, null, sysrate, null, null);
    CHECK_RESULT(result);

    var ms = numbuffers.val * buffersize.val * 1000 / rate.val;
    document.getElementById("info-mixer").innerHTML =
        "Mixer rate = " + rate.val +
        "hz : System rate = " + sysrate.val +
        "hz : DSP buffer size = " + numbuffers.val +
        " buffers of " + buffersize.val +
        " samples (" + ms.toFixed(2) + " ms)";

    document.getElementById("info-emitter").innerHTML =
        "Emitter position: [" +
        parseInt(emitterTransform.x, 10) + ", " +
        parseInt(emitterTransform.y, 10) + ", " +
        parseInt(emitterTransform.z, 10) + "]";
    document.getElementById("info-listener").innerHTML =
        "Listener position: [" +
        parseInt(listenerTransform.x, 10) + ", " +
        parseInt(listenerTransform.y, 10) + ", " +
        parseInt(listenerTransform.z, 10) + "]";

    var pos  = FMOD.VECTOR();
    var vel  = FMOD.VECTOR();

    pos.x = listenerTransform.x;
    pos.y = listenerTransform.z;
    pos.z = listenerTransform.y;
    vel.x = (pos.x - lastListenerPosition.x) / 50;              // setinterval is set to 20ms, so 50 times a second.   We need units moved per second, not per update.
    vel.z = (pos.z - lastListenerPosition.z) / 50;              // setinterval is set to 20ms, so 50 times a second.   We need units moved per second, not per update.
    update3DPosition("listener", pos, vel)
    lastListenerPosition.x = pos.x;
    lastListenerPosition.y = pos.y;
    lastListenerPosition.z = pos.z;

    pos.x = emitterTransform.x;
    pos.y = emitterTransform.z;
    pos.z = emitterTransform.y;
    vel.x = (pos.x - lastEmitterPosition[0].x) / 50;           // setinterval is set to 20ms, so 50 times a second.   We need units moved per second, not per update.
    vel.z = (pos.z - lastEmitterPosition[0].z) / 50;           // setinterval is set to 20ms, so 50 times a second.   We need units moved per second, not per update.
    update3DPosition("emitter", pos, vel)
    lastEmitterPosition[0].x = pos.x;
    lastEmitterPosition[0].z = pos.z;



    // Update FMOD
    result = gSystem.update();
    CHECK_RESULT(result);
}
