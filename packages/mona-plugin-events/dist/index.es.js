var o=new Proxy({},{get:function(o,n){return function(o){var e;console.info("非飞鸽容器, "+n+" 方法无法调用"),"object"==typeof o&&(null===(e=null==o?void 0:o.failed)||void 0===e||e.call(o,{code:-100,message:"非飞鸽容器"}))}},set:function(){return!1}}),n=new Proxy({},{get:function(n,e){var i;return"globalStore"===e?null===window||void 0===window?void 0:window.monaGlobalStore:(null===(i=null===window||void 0===window?void 0:window.____MONA_SDK_NAME_IN_WINDOW____)||void 0===i?void 0:i[e])||o},set:function(){return!1}});export{n as default};
//# sourceMappingURL=index.es.js.map
