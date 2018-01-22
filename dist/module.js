'use strict';

System.register(['./datasource', './query_ctrl', './annotation_ctrl'], function (_export, _context) {
  "use strict";

  var GenericDatasource, GenericDatasourceQueryCtrl, GenericAnnotationsQueryCtrl, GenericConfigCtrl, GenericQueryOptionsCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      GenericDatasource = _datasource.GenericDatasource;
    }, function (_query_ctrl) {
      GenericDatasourceQueryCtrl = _query_ctrl.GenericDatasourceQueryCtrl;
    }, function (_annotation_ctrl) {
      GenericAnnotationsQueryCtrl = _annotation_ctrl.GenericAnnotationsQueryCtrl;
    }],
    execute: function () {
      _export('ConfigCtrl', GenericConfigCtrl = function GenericConfigCtrl($scope) {
        _classCallCheck(this, GenericConfigCtrl);

        this.current.url = this.current.url;
        this.current.jsonData = this.current.jsonData || {};
        this.current.jsonData.keystoneUrl = this.current.jsonData.keystoneUrl;
        this.current.jsonData.canPassword = this.current.jsonData.canPassword;
        this.current.jsonData.canUsername = this.current.jsonData.canUsername;
        this.current.jsonData.canTenant = this.current.jsonData.canTenant;
      });

      GenericConfigCtrl.templateUrl = 'partials/config.html';

      _export('QueryOptionsCtrl', GenericQueryOptionsCtrl = function GenericQueryOptionsCtrl() {
        _classCallCheck(this, GenericQueryOptionsCtrl);
      });

      GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

      // class GenericAnnotationsQueryCtrl {}
      // GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

      _export('Datasource', GenericDatasource);

      _export('QueryCtrl', GenericDatasourceQueryCtrl);

      _export('ConfigCtrl', GenericConfigCtrl);

      _export('QueryOptionsCtrl', GenericQueryOptionsCtrl);

      _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
