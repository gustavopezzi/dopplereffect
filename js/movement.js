$(document).ready(function() {
    function render(update) {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        intervalId = setInterval(move, 25);

        var CANVAS_WIDTH = canvas.width - 10;
        var CANVAS_HEIGHT = canvas.height - 10;

        var car = {
            x: 60,
            y: CANVAS_HEIGHT / 2 - 20,
            width: 30,
            height: 54,
            angle: Math.PI / 2,
            speed: 0,
            maxSpeed: 8.0,
            acc: 0.2,
            dec: 0.3,
            omega: 0,
            turnThrottle: 40,
            speedRatio: 1
        };

        var KEY_F = false, KEY_B = false, KEY_L = false, KEY_R = false;
        var KEY_W = false, KEY_A = false, KEY_S = false, KEY_D = false;

        var carImg = new Image();
        carImg.src = "img/car.png";
        carImg.onload = function () {
            ctx.save();
            ctx.translate(car.x, car.y);
            ctx.rotate(car.angle);
            ctx.drawImage(carImg, -15, -27);
            ctx.restore();
        }

        var listenerImg = new Image();
        listenerImg.src = "img/listener.png";
        listenerImg.onload = function () {
            ctx.save();
            ctx.translate(listenerTransform.x, listenerTransform.y);
            ctx.drawImage(listenerImg, -12, -12);
            ctx.restore();
        }

        var dieImg = new Image();
        dieImg.src = "img/dead.png";
        dieImg.onload = function () {
            ctx.save();
            ctx.translate(listenerTransform.x, listenerTransform.y);
            ctx.drawImage(listenerImg, -12, -12);
            ctx.restore();
        }

        $(document).keydown(onKeyDown);
        $(document).keyup(onKeyUp);

        function onKeyDown(evt) {
            if (evt.keyCode == 66)
                BYPASS_FILTER = true;
            if (evt.keyCode == 70)
                BYPASS_FILTER = false;
            if (evt.keyCode == 39)
                KEY_R = true;
            else if (evt.keyCode == 37)
                KEY_L = true;
            else if (evt.keyCode == 38)
                KEY_F = true;
            else if (evt.keyCode == 40)
                KEY_B = true;
            if (KEY_F || KEY_B)
                evt.preventDefault();
            if (evt.keyCode == 87)
                KEY_W = true;
            else if (evt.keyCode == 65)
                KEY_A = true;
            else if (evt.keyCode == 83)
                KEY_S = true;
            else if (evt.keyCode == 68)
                KEY_D = true;
            if (KEY_W || KEY_S)
                evt.preventDefault();
        }

        function onKeyUp(evt) {
            if (evt.keyCode == 39)
                KEY_R = false;
            else if (evt.keyCode == 37)
                KEY_L = false;
            else if (evt.keyCode == 38)
                KEY_F = false;
            else if (evt.keyCode == 40)
                KEY_B = false;
            if (evt.keyCode == 87)
                KEY_W = false;
            else if (evt.keyCode == 65)
                KEY_A = false;
            else if (evt.keyCode == 83)
                KEY_S = false;
            else if (evt.keyCode == 68)
                KEY_D = false;
        }

        function checkCollision(rect1, rect2) {
            if (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height + rect1.y > rect2.y
            ) {
                return true;
            }
            return false;
        }

        function clear() {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        function move() {
            if (KEY_F && car.speed < car.maxSpeed) {
                if (car.speed < 0) {
                    car.speed += car.dec;
                }
                else {
                    car.speed += car.acc;
                }
            }
            else if (KEY_B && car.speed > (-1 * car.maxSpeed)) {
                if (car.speed > 0)
                    car.speed -= car.dec;
                else
                    car.speed -= car.acc;
            }
            else {
                if (car.speed - car.dec > 0)
                    car.speed -= car.dec;
                else if (car.speed + car.dec < 0)
                    car.speed += car.dec;
                else
                    car.speed = 0;
            }

            if (car.speed != 0) {
                car.speedRatio = car.speed / car.maxSpeed;
                car.omega = (Math.PI / car.turnThrottle) * car.speedRatio;
            }

            car.x += Math.sin(car.angle) * car.speed;
            car.y -= Math.cos(car.angle) * car.speed;

            emitterTransform = {
                x: car.x,
                y: car.y,
                z: 0,
                width: 32,
                height: 32
            };

            if (KEY_W && !ranOver) {
                listenerTransform.y -= 5;
            }
            else if (KEY_A && !ranOver) {
                listenerTransform.x -= 5;
            }
            else if (KEY_S && !ranOver) {
                listenerTransform.y += 5;
            }
            else if (KEY_D && !ranOver) {
                listenerTransform.x += 5;
            }

            if (car.x > CANVAS_WIDTH - 30)
                car.x = CANVAS_WIDTH - 30;
            if (car.x < 30)
                car.x = 30;
            if (car.y > CANVAS_HEIGHT - 30)
                car.y = CANVAS_HEIGHT - 30;
            if (car.y < 30)
                car.y = 30;

            if (KEY_R && car.speed != 0)
                car.angle += car.omega;
            else if (KEY_L && car.speed != 0)
                car.angle -= car.omega;

            if (listenerTransform.x > CANVAS_WIDTH)
                listenerTransform.x = CANVAS_WIDTH;
            if (listenerTransform.x < 0)
                listenerTransform.x = 0;
            if (listenerTransform.y > CANVAS_HEIGHT)
                listenerTransform.y = CANVAS_HEIGHT;
            if (listenerTransform.y < 0)
                listenerTransform.y = 0;

            clear();

            if (checkCollision(emitterTransform, listenerTransform)) {
                ranOver = true;
            }

            if (ranOver) {
                ctx.save();
                ctx.translate(listenerTransform.x, listenerTransform.y);
                ctx.drawImage(dieImg, -12, -12);
                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(listenerTransform.x, listenerTransform.y);
                ctx.drawImage(listenerImg, -12, -12);
                ctx.restore();
            }

            ctx.save();
            ctx.translate(car.x, car.y);
            ctx.rotate(car.angle);
            ctx.drawImage(carImg, -15, -27);
            ctx.restore();

            if (!gDSPEffect || gDSPEffect.length == 0 || !gDSPEffect[0]) {
                return;
            }

            result = gDSPEffect[0].setBypass(BYPASS_FILTER);
            CHECK_RESULT(result);

            emitterSpeed = car.speed;
            result = gDSPEffect[0].setParameterFloat(FMOD.DSP_LOWPASS_CUTOFF, (Math.abs(emitterSpeed) + 1) * 1000.0);
            CHECK_RESULT(result);

            result = gDSPEffect[0].setParameterFloat(FMOD.DSP_LOWPASS_RESONANCE, 2.0);
            CHECK_RESULT(result);
        }
    }

    window.onload = function() {
        render(false);
    }
});
