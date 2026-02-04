(function () {
    window.launch = function () {
        const url = "https://burnedfart.github.io/navigator/index.html";

        // 1. Open a clean about:blank window
        const win = window.open("", "_blank");
        if (!win || win.closed) {
            alert("Please allow popups to access Navigator.");
            return;
        }

        // 2. Handshake Listener
        const handleMessage = (event) => {
            if (event.data === "navigator-ready") {
                window.removeEventListener("message", handleMessage);
                // Redirect parent
                setTimeout(() => {
                    window.location.replace("https://google.com");
                }, 500);
            }
        };
        window.addEventListener("message", handleMessage);

        // 3. Segmented DOM Injection
        try {
            const doc = win.document;
            doc.title = "Home - Google Drive";

            // Icon
            const link = doc.createElement("link");
            link.rel = "icon";
            link.href = "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png";
            doc.head.appendChild(link);

            // Styles
            const style = doc.createElement("style");
            style.textContent = "body, html { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #000; } iframe { width: 100%; height: 100%; border: none; display: block; }";
            doc.head.appendChild(style);

            // Proxy Iframe
            const iframe = doc.createElement("iframe");
            iframe.src = url;
            iframe.allow = "accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; speaker-selection; usb; web-share; xr-spatial-tracking";
            iframe.setAttribute('allowfullscreen', 'true');
            doc.body.appendChild(iframe);

            // Boot Script
            const bootScript = doc.createElement("script");
            bootScript.textContent = `
                (function() {
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage("navigator-ready", "*");
                    }
                    window.onbeforeunload = function() { return "Leave Navigator?"; };
                    setInterval(() => {
                        try { if (window.opener) window.opener = null; } catch(e) {}
                    }, 200);
                })();
            `;
            doc.body.appendChild(bootScript);

        } catch (err) {
            console.error("Cloak failed:", err);
            win.location.replace(url);
        }

        // 4. Failsafe
        setTimeout(() => {
            if (window.location.href.includes("github.io/a")) {
                window.location.replace("https://google.com");
            }
        }, 6000);
    };
})();
