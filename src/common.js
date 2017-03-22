import {datemath} from './datemath-parser';
export {Common};
class Common{}
Common.endpoints ={
        'query': '/analytics/query',
        'tables':'/analytics/tables'
}
Common.toDate = function(someDate){
    if(someDate !== null && typeof someDate === 'object'){
        let timeString = someDate._d || someDate._i;
        return Date.parse(timeString);
    }else if(someDate !== null && typeof someDate === 'string'){
        return datemath().parse(someDate);
    }
}
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