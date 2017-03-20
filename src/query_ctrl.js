import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.target = this.target.target || 'select metric';
    this.target.type = this.target.type || 'timeserie';
    this.target.pselect = this.target.pselect || false;
    this.target.selected = this.target.selected || [];
}

  getOptions() {
    return this.datasource.metricFindQuery(this.target)
      .then(this.uiSegmentSrv.transformToSegments(false));
      // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
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

