import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'
import {Common} from './common'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.table = this.target.table || Common.strings.selectTable;
    //TODO: support the table view.
    //TODO: support rawQuery
    this.target.type = this.target.type || 'timeseries';
    this.target.pCols = this.target.pCols || false;
    this.target.selCol = this.target.selCol || null;
    this.target.allCols = this.target.allCols || null;
    this.target.advanced = this.target.advanced || false;
    this.target.selFilterOp = this.target.selFilterOp || null;
    this.target.filterVal = this.target.filterVal || null;
    this.target.filterVal2 = this.target.filterVal2 || null;
    this.target.whereArray = this.target.whereArray || [[{name:'name',value:'',op:'prefix'}]];
}

  getTables() {
    let param ={};
    //TODO: handle grafana bug where they have the from and to fields.
    param.start = Common.toDate(this.panelCtrl.dashboard.time.from);
    param.end = Common.toDate(this.panelCtrl.dashboard.time.end);
    return this.datasource.findAllTables(param)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
      // return this.datasource.findAllTables(this.target);
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeTable() {
    var selectedTable = this.target.table;
    if(!selectedTable.includes('select metric')){
      this.datasource.getColumns(selectedTable).then(result=>{
        this.target.pCols = result.filtered;
        this.target.pCols.unshift({text:Common.strings.selectColumn});
        this.target.allCols = result.unfiltered;
        this.target.selCol= pCols[0];
      });
    }
  }

  colSelect(){
    if(this.target.selCol && this.target.selCol.text !== Common.strings.selectColumn)
      this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }

  getOperators(colName=null){
    if(colName != null){
      //TODO: filter operators based on col datatype
      return Common.allOperators;
    }
    else
      return Common.allOperators;
  }

  addOrRow(){
    this.target.whereArray.push([{}]);
  }
  addAndRow(index){
    this.target.whereArray[index].push({});
  }
  delAndRow(pIndex,index){
    this.target.whereArray[pIndex].splice(index,1);
    if(this.target.whereArray[pIndex].length == 0)
      this.target.whereArray.splice(pIndex,1);
  }
  getAllCols(){
    return this.target.allCols;
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

