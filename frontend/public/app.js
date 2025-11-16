window.App = (function(){
    function getToken(){
        return localStorage.getItem('token') || '';
    }
    function parseEmailFromToken(token){
        try{ return JSON.parse(atob((token||'').split('.')[1])).email || ''; }catch(_){ return ''; }
    }
    function ensureAuthOrRedirect(){
        const t = getToken();
        if(!t){ window.location.href = '/auth'; return null; }
        return t;
    }
    return { getToken, parseEmailFromToken, ensureAuthOrRedirect };
})();


