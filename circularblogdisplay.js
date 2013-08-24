(function () {

    //create the default object
    var circularBlogDisplay = {};

    // global on the server, window in the browser
    var root = this;

    //set the current theme index
    circularBlogDisplay.currentTheme = 0;

    //array of colour themes
    var themes = [
        {
            colors: ["rgba(0, 76, 153, 0.60)", "rgba(0, 128, 255, 0.60)", "rgba(51, 153, 255, 0.60)", "rgba(153, 153, 255, 0.60)", "rgba(102, 102, 255, 0.60)", "rgba(153, 153, 255, 0.60)", "rgba(204, 204, 255, 0.60)"],
            center: "rgba(204, 204, 255, 0.60)"
        },
        {
            colors: ["rgba(153, 0, 0, 0.60)", "rgba(204, 0, 0, 0.60)", "rgba(255, 0, 0, 0.60)", "rgba(255, 51, 51, 0.60)", "rgba(255, 102, 102, 0.60)", "rgba(255, 153, 153, 0.60)", "rgba(255, 204, 204, 0.60)"],
            center: "rgba(255, 204, 204, 0.60)"
        },
        {
            colors: ["rgba(153, 76, 0, 0.60)", "rgba(204, 102, 0, 0.60)", "rgba(255, 128, 0, 0.60)", "rgba(255, 153, 51, 0.60)", "rgba(255, 178, 102, 0.60)", "rgba(255, 204, 153, 0.60)", "rgba(255, 204, 204, 0.60)"],
            center: "rgba(255, 229, 204, 0.60)"
        }
    ]

    //the initial function that calls the feed url
    circularBlogDisplay.initialize = function (google, url) {
        var feed = new google.feeds.Feed(url);
        feed.setNumEntries(7);
        feed.load(function (result) {
            if (!result.error) {
                circularBlogDisplay.drawCircles(window.document.getElementById("blogs"), circularBlogDisplay.dataMaker(result.feed));
            }
        });
    }

    //take a google feed and add in the circle settings in a random way
    circularBlogDisplay.dataMaker = function (feed) {
        var radiusOffest = 0;
        var gap = 10;
        var colors = themes[circularBlogDisplay.currentTheme].colors;
        for (var x = 0; x < feed.entries.length; x++) {
            feed.entries[x].speed = ((Math.floor(Math.random() * 10) + 1) / 10) * Math.PI / 270;
            feed.entries[x].ringWidth = 20;
            feed.entries[x].colorIndex = x;
            feed.entries[x].color = colors[x];
            var p = ((Math.floor(Math.random() * 20) + 1) / 10);
            feed.entries[x].endAngle = p * Math.PI;
            feed.entries[x].startAngle = feed.entries[x].endAngle + (feed.entries[x].title.length * (1.5 * Math.PI / 180)) + (4 * Math.PI / 180);
            feed.entries[x].radiusOffest = radiusOffest;
            radiusOffest += feed.entries[x].ringWidth + gap;
        }
        return feed;
    }

    circularBlogDisplay.drawCircles = function (canvas, feed) {

        //get the context and animation frame
        var context = canvas.getContext("2d"),
        requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

        //get center
        var centerX = canvas.clientWidth / 2;
        var centerY = canvas.clientHeight / 2;

        var mouse = { x: centerX, y: centerY, down: false, up: false, url: '', selected: false, paused: false };

        var canvasItemOver = {};
        var showInfo = false;

        //get mouse position
        canvas.addEventListener('mousemove', function (evt) {
            mouse.x = evt.clientX - canvas.clientLeft;
            mouse.y = evt.clientY - canvas.clientTop;

        }, false);

        //get mouse click
        canvas.addEventListener('mousedown', function (evt) {
            mouse.down = true;
            mouse.up = false;
        }, false);

        //get mouse click end
        canvas.addEventListener('mouseup', function (evt) {
            mouse.up = true;
            mouse.down = false;
            mouse.selected = (mouse.url !== '');
            if (canvasItemOver.item === 'info') {
                currentTheme += 1;
                if (currentTheme > themes.length) currentTheme = 0;
                initialize();
                //mouse.paused = (mouse.paused) ? false : true;
                //showInfo = mouse.paused;

            } else {
                mouse.paused = false;
            }
        }, false);

        //window.location = mouse.url;

        // Clear the canvas
        function clearCanvas() {
            context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        }
        // Draw the blogs
        var startValue = 0;
        var radiusShrink = 0;
        function redrawData() {
            //resize canvas
            canvas.width = window.innerWidth * 0.9;
            canvas.height = window.innerHeight * 0.9;
            //reset center
            var centerX = canvas.clientWidth / 2;
            var centerY = canvas.clientHeight / 2;
            var initRadius = (centerX > centerY) ? centerY : centerX;
            initRadius -= 20;

            // Gimme a transparent canvas to work with
            clearCanvas();

            canvasItemOver = { 'item': null };

            var radius = 0;
            var allGone = true;
            var counter = 0;
            var hit = false;
            //loop through feeds
            for (var x = 0; x < feed.entries.length; x++) {
                feed.entries[x].color = themes[circularBlogDisplay.currentTheme].colors[feed.entries[x].colorIndex];
                if (mouse.selected && counter < 5) {
                    radiusShrink += 0.5;
                    feed.entries[x].ringWidth = (feed.entries[x].ringWidth > 0) ? feed.entries[x].ringWidth - 0.5 : 0;
                }
                if (feed.entries[x].ringWidth > 0) {
                    allGone = false;
                    radius = initRadius - feed.entries[x].radiusOffest - (feed.entries[x].ringWidth / 2) - radiusShrink;

                    //draw arc
                    context.strokeStyle = context.fillStyle = feed.entries[x].color;
                    context.beginPath();
                    context.arc(centerX, centerY, radius, feed.entries[x].startAngle, feed.entries[x].endAngle, true);
                    context.lineWidth = feed.entries[x].ringWidth;
                    //check if mouse over
                    hit = context.isPointInPath(mouse.x, mouse.y);
                    context.stroke();
                    //mouse.url = '';
                    //do hit test
                    if (hit) {
                        canvasItemOver = { 'item': 'entry', 'data': feed.entries[x] };
                        if (mouse.down) {
                            mouse.url = feed.entries[x].link;
                        }
                        //set cursor
                        canvas.style.cursor = 'pointer';
                        //set font etc
                        context.font = (feed.entries[x].ringWidth - 8) + 'pt Calibri';
                        context.textAlign = 'left';
                        context.strokeStyle = context.fillStyle = 'white';
                        context.lineWidth = 4;
                        //draw text
                        var len = feed.entries[x].title.length, s;
                        context.save();
                        context.translate(centerX, centerY);
                        context.rotate(feed.entries[x].endAngle + (92 * Math.PI / 180));
                        for (var n = 0; n < len; n++) {
                            if (n > 0) context.rotate((1.5 * Math.PI / 180));
                            context.save();
                            context.translate(0, -1 * (radius - 4));
                            s = feed.entries[x].title[n];
                            context.fillText(s, 0, 0);
                            context.restore();
                        }
                        context.restore();
                    }

                    if (!hit && !mouse.paused) {
                        //set cursor
                        canvas.style.cursor = 'default';
                        //rotate arc
                        feed.entries[x].startAngle += feed.entries[x].speed;
                        feed.entries[x].endAngle += feed.entries[x].speed;
                    }
                }

            }

            radius -= 40;
            if (radius > 0) {
                //draw center
                context.beginPath();
                context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                context.fillStyle = themes[circularBlogDisplay.currentTheme].center;
                context.fill();
                context.lineWidth = 5;
                context.strokeStyle = themes[circularBlogDisplay.currentTheme].center;
                context.stroke();
                //check if mouse over
                hit = context.isPointInPath(mouse.x, mouse.y);
                context.stroke();
                //mouse.url = '';
                //do hit test
                if (hit) {
                    canvasItemOver = { 'item': 'feed', 'data': feed };
                    if (mouse.down) {
                        mouse.url = feed.link;
                    }
                    //set cursor
                    canvas.style.cursor = 'pointer';
                }
            }
            //draw text
            if (!mouse.selected) {
                //set font etc
                context.font = '15pt Calibri';
                context.textAlign = 'left';
                context.strokeStyle = context.fillStyle = 'white';
                context.lineWidth = 4;
                radius -= 20;
                var len = feed.title.length, s;
                context.save();
                context.translate(centerX, centerY);
                var rotation = (6 * Math.PI / 180);
                context.rotate(0 - (rotation * (feed.title.length / 2)));
                for (var n = 0; n < len; n++) {
                    if (n > 0) context.rotate((6 * Math.PI / 180));
                    context.save();
                    context.translate(0, -1 * (radius - 4));
                    s = feed.title[n];
                    context.fillText(s, 0, 0);
                    context.restore();
                }
                context.restore();
            }


            if (allGone) {
                window.location = mouse.url;
            }

            counter += 1;
            if (counter > 5) counter = 0;
            // request new frame
            if (!allGone) {
                window.requestAnimFrame(function () {
                    redrawData();
                });
            }
        }

        // Start drawing, when the browser says so
        window.requestAnimFrame(function () {
            redrawData();
        });
    }
    
    window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();


    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return circularBlogDisplay;
        });
    }
    // included directly via <script> tag
    else {
        root.circularBlogDisplay = circularBlogDisplay;
    }
}());