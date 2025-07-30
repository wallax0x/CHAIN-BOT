const startTime = Date.now();

module.exports = {
    getUptime: () => {
        const s = Math.floor((Date.now() - startTime) / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const s_rem = s % 60;
        return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s_rem.toString().padStart(2, '0')}s`;
    }
};
