import {GenericDatasource} from './datasource';
import {GenericDatasourceQueryCtrl} from './query_ctrl';

class GenericConfigCtrl {
  constructor($scope) {
    this.current.url = this.current.url || 'http://bakesville-vm22:8081';
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.keystoneUrl = this.current.jsonData.keystoneUrl || 'http://bakesville-vm22:35357/v2.0/tokens';
    this.current.jsonData.canPassword = this.current.jsonData.canPassword || 'contrail123';
    this.current.jsonData.canUsername = this.current.jsonData.canUsername || 'admin';
  }
}

GenericConfigCtrl.templateUrl = 'partials/config.html';

class GenericQueryOptionsCtrl {}
GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

class GenericAnnotationsQueryCtrl {}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

export {
  GenericDatasource as Datasource,
  GenericDatasourceQueryCtrl as QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
