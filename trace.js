(function(){var o=Storage.prototype.setItem,r=Storage.prototype.removeItem;
function log(m){var l=JSON.parse(sessionStorage.getItem("azlog")||"[]");l.push(new Date().toISOString().slice(14,23)+" "+m);sessionStorage.setItem("azlog",JSON.stringify(l.slice(-40)))}
Storage.prototype.setItem=function(k,v){if(k==="ab_jobs")log("SET n="+JSON.parse(v).length+" "+((new Error().stack||"").split("\n")[2]||"").trim());return o.apply(this,arguments)};
Storage.prototype.removeItem=function(k){if(k==="ab_jobs")log("REMOVE ab_jobs");return r.apply(this,arguments)};
log("LOAD ab_jobs n="+JSON.parse(localStorage.getItem("ab_jobs")||"[]").length);
})();
