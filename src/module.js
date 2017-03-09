import {GenericDatasource} from './datasource';
import {GenericDatasourceQueryCtrl} from './query_ctrl';

class GenericConfigCtrl {
  constructor($scope){
    this.current.url = this.current.url || "https://bakesville-vm22:8143";
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.keystone_url = this.current.jsonData.keystone_url || "http://bakesville-vm22:35357/v2.0/tokens";
    this.current.jsonData.can_password = this.current.jsonData.can_password || "contrail123";
    this.current.jsonData.can_username = this.current.jsonData.can_username || "admin";
  }
}

GenericConfigCtrl.templateUrl = 'partials/config.html';

class GenericQueryOptionsCtrl {}
GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

class GenericAnnotationsQueryCtrl {}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html'

export {
  GenericDatasource as Datasource,
  GenericDatasourceQueryCtrl as QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
