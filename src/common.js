import _ from "lodash";
import {datemath} from './datemath-parser';
export {Common};
class Common{}
Common.endpoints ={
        'query': '/analytics/query',
        'tables':'/analytics/tables',
        'table': '/analytics/table',
        'tableSchema': '/schema'       
}
Common.strings ={
    'selectTable': 'Select Table',
    'selectColumn': 'Select Field'
}
Common.allOperators = ['EQUAL','NOT_EQUAL','IN_RANGE','NOT_IN_RANGE','LEQ','GEQ','PREFIX','REGEX_MATCH'];
Common.filteredCol = ['t','t=','class(t)','class(t=)'];
Common.numTypes = ['int','long'];
Common.toDate = function(someDate){
    if(someDate !== null && typeof someDate === 'object'){
        let timeString = someDate._d || someDate._i;
        return Date.parse(timeString)*1000;
    }else if(someDate !== null && typeof someDate === 'string'){
        return datemath().parse(someDate) *1000;
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
Common.processResultData = function(result){
    //TODO: normalize data here
    var newData = [];
    _.each(result.data.value, (d,i)=>{
        var time = d["T"];
        _.each(d, (v,k)=>{
            if(k != "T" && k != "CLASS(T)")
                newData.push([v/100000,time/1000]);
        });
    });
    return {'target':result.config.data.select_fields[1],'datapoints':newData};
}