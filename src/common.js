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
Common.numTypes = ['int','long','percentiles','double','avg'];
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
    if(resp.status === 200 && response.access != null)
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
                newData.push([v,time/1000]);
        });
    });
    return {'target':result.config.data.select_fields[1],'datapoints':newData};
}
Common.filterQueryFields=function(targetObj){
    let whereArray = [];
    if(!targetObj.advanced){
        targetObj.where = null;
        targetObj.filter = null;
    }else{
        _.each(targetObj.whereArray, (andRowArray,i)=>{
            let innerArray=[];
            _.each(andRowArray, (andRow,j)=>{
                if(andRow.op == null ||
                    andRow.name==null ||
                    andRow.value==null ||
                    andRow.value=="" || 
                    (andRow.op && 
                        andRow.op.toLowerCase().indexOf('range')!==-1 &&
                        andRow.value2==null)
                   )
                    return false;
                innerArray.push({
                    name: andRow.name,
                    op: andRow.op,
                    value: andRow.value,
                    value2: andRow.value2
                });
            });
            if(innerArray.length===0)
                return false;
            whereArray.push(innerArray);
        });
        targetObj.where = whereArray.length === 0 ? null: whereArray;
        let filterObj = targetObj.filterObj;
        targetObj.filter = filterObj;
        if(targetObj.selCol == null ||
            targetObj.selCol === Common.strings.selectColumn ||
            filterObj.selFilterOp ==null || 
            filterObj.filterVal == null || 
            filterObj.filterVal == "" ||
            (filterObj.selFilterOp && 
                filterObj.selFilterOp.toLowerCase().indexOf('range')!==-1 && 
                filterObj.filterVal2==null))
            targetObj.filter = null;
    }
    return targetObj;
}
Common.isValidQuery=function(targetObj){
    if(targetObj.table == null || 
       targetObj.selCol == null ||
       targetObj.selCol === Common.strings.selectColumn)
        return false;
    return true;
}
Common.transform=function(targetObj){
    if(targetObj.filter){
        targetObj.filter=[{
            name:targetObj.selCol,
            value:targetObj.filter.filterVal,
            // value2:targetObj.filter.filterVal2,
            op:Common.allOperators.indexOf(targetObj.filter.selFilterOp)+1
        }];
        
    }
    if(targetObj.where){
        _.each(targetObj.where, (andRowArray,i)=>{
            _.each(andRowArray, (andRow,j)=>{
                targetObj.where[i][j].name = targetObj.where[i][j].name;
                targetObj.where[i][j].op = Common.allOperators.indexOf(targetObj.where[i][j].op)+1;
            });
        });
    }
    return targetObj;
}