export {getAuthDict, processAuthResponse};

function getAuthDict(user, pass, tenant='admin'){
    return {auth:{passwordCredentials:{username: user ,
                                       password: pass},
                   tenantName: tenant}};
}

function processAuthResponse(resp){
     let response = resp.data;
     if(response.access != null)
        return {token:response.access.token.id,
                expire:response.access.token.expires
                };
    return null;
}