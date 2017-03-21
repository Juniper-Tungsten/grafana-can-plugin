export {Common}
class Common{}
Common.getAuthDict = function(user, pass, tenant='admin'){
    return {auth:{passwordCredentials:{username: user ,
                                        password: pass},
            tenantName: tenant}};
}
Common.processAuthResponse = function(resp){
    let response = resp.data;
    if(response.access != null)
        return {token:response.access.token.id,
                expire:response.access.token.expires
                };
    return null;
}
Common.endpoints ={
        'query': '/analytics/query',
        'tables':'/analytics/tables'
}