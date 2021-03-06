'use strict';

app.directive('connectionsTree', function($compile, $rootScope, connectionModel,connection) {
    return {
        transclude: true,
        scope: {
            layerDatasourceId: '=',
            onAddedDataset: '=',
            properties: '=',
            onGetConnections: '=',
            onElementClick: '='
        },

        templateUrl: "wst-connections-tree/views/connectionsTree.html",

        // append
        replace: true,
        // attribute restriction
        restrict: 'E',
        // linking method
        link: function ($scope, element, attrs) {

          connectionModel.getConnections({},function(data){
            $scope.datasources = data.items;
            if ($scope.onGetConnections)
                $scope.onGetConnections(data.items);
          })

          $scope.$watch('layerDatasourceId', function(val,old){
              $scope.layerDatasourceId = $scope.layerDatasourceId;
          });

          $scope.$watch('properties', function(val,old){
              //if ($scope.properties.showSelected)
          });


            $scope.addDatasetToModel = function (datasourceID,entity)
            {

                if (datasourceID == $scope.layerDatasourceId || !$scope.layerDatasourceId) {
                    if (!entity.fields || entity.fields.length <= 0) {
                        var entityname = entity.table_name;
                        var schemaname = entity.table_schema;

                        connectionModel.getEntityfields([datasourceID], schemaname, entityname, function (result) {
                             if (result.result == 1) {
                                 entity.fields = result.items;
                                addDatasetToModel(datasourceID, entity);
                            }

                        });
                    } else {
                        addDatasetToModel(datasourceID, entity);
                    }
                }
            }

            function addDatasetToModel(datasourceID,entity)
            {
                    var theNewEntity = {};
                    theNewEntity.datasourceID = datasourceID;
                    theNewEntity.entityID = generateShortUID();
                    theNewEntity.entityType = 'table'; //sql and others
                    theNewEntity.parentEntityID = entity.entityID;
                    theNewEntity.schema_name = entity.table_schema;
                    theNewEntity.attributes = [];
                    theNewEntity.description = "";
                    theNewEntity.table_name = entity.table_name;
                    for (var f in entity.fields) {
                        var theElement = {};
                        theElement.collectionID = theNewEntity.entityID;
                        theElement.collectionName = theNewEntity.table_name;
                        theElement.collectionSchema = theNewEntity.schema_name;
                        theElement.collectionType = theNewEntity.entityType;
                        theElement.datasourceID = datasourceID;
                        theElement.elementID = generateShortUID();
                        theElement.elementName = entity.fields[f].column_name;
                        theElement.elementLabel = entity.fields[f].column_name;
                        theElement.table_name =
                        theElement.data_type = entity.fields[f].data_type;
                        theElement.elementType = entity.fields[f].elementType;
                        theElement.length = entity.fields[f].length;
                        theElement.precission = entity.fields[f].precission;
                        theElement.scale = entity.fields[f].scale;
                        theElement.required = entity.fields[f].required;
                        theElement.isPK = entity.fields[f].isPK;
                        theNewEntity.attributes.push(theElement);
                    }
                    $rootScope.$emit('addEntity', theNewEntity);
                    if ($scope.onAddedDataset)
                        $scope.onAddedDataset(theNewEntity,datasourceID);
            }


            $scope.getSchemasForDatasource = function(datasourceID,datasource,refresh)
            {
                if (!datasource.schemas || datasource.schemas.length == 0 || refresh == true) {
                    datasource.loading = true;
                    connectionModel.getSchemasForConnection(datasourceID, function (result) {
                        datasource.loading = false;
                        var schemas = [];
                        for (var s in result.items) {
                            var schema = {};
                            schema.schemaID = datasourceID + result.items[s].table_schema;
                            schema.schema_name = result.items[s].table_schema;

                            schemas.push(schema);
                        }
                        datasource.schemas = schemas;

                    });
                } else {
                  datasource.schemas = [];
                }
            }

            $scope.getDatasetsForThisSchema = function (datasourceID,schemaName, schema, refresh)
            {

                if (!schema.entities || schema.entities.length == 0 || refresh == true) {

                    connection.get('/api/v3/admin/connections/'+datasourceID+'/schema/'+schemaName+'/entities', {
                    }, function (data) {

                        if (data.result == 1) {
                            for (var e in data.items) {
                                data.items[e].entityID = datasourceID + data.items[e].table_schema + data.items[e].table_name;
                            }
                            schema.entities = data.items;
                        }
                    });
                } else {
                  schema.entities = [];
                }

            }

            $scope.getFieldsForThisEntity = function (dataSourceID,entity, theEntity, refresh)
            {

                if (!theEntity.attributes || theEntity.attributes.length == 0 || refresh == true) {


                    var entityname = entity.table_name;
                    var schemaname = entity.table_schema;

                    connectionModel.getEntityfields([dataSourceID], schemaname, entityname, function (result) {

                        if (result.result == 1) {
                            theEntity.attributes = result.items;
                        }
                        
                    });
                } else {
                  theEntity.attributes = [];
                }
            }

        }


    }

    function generateShortUID() {
        return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
    }

});
