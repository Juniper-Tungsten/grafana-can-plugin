import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'
import {Common} from './common'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.target = this.target.target || 'select metric';
    //TODO: support the table view.
    //TODO: support rawQuery
    this.target.type = this.target.type || 'timeseries';
    this.target.pselect = this.target.pselect || false;
    this.target.selected = this.target.selected || [];
}

  getTables() {
    let param ={};
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
    var selected_table = this.target.target;
    if(!selected_table.includes('select metric')){
      this.datasource.getpselects(selected_table).then(pselect=>{
        this.target.pselect = pselect;
      });
    }
  }
  cSelect(){
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

