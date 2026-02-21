module.exports = {
    apps: [{
        name: "pafi-balikpapan",
        script: "./app.js",
        instances: 1, // atau "max" jika ingin load balancing di semua core CPU
        exec_mode: "fork",
        watch: false,
        env: {
            NODE_ENV: "production",
            PORT: 3004 // Menggunakan port 3004 (port &gt; 3003)
        }
    }]
};
