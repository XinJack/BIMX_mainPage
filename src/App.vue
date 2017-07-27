<template>
  <div id="app">
    <div id="navbar">
      <el-menu theme="dark" mode="horizontal" @select="handleMenuSelect">
        <el-menu-item index = "1">BIMX</el-menu-item>
        <el-submenu index="2">
          <template slot="title">加载模型</template>
          <el-menu-item :key="model.modelId" v-for="(model, index) in models" :index="model.modelId" v-text="model.modelName"></el-menu-item>
        </el-submenu>
        <el-submenu index="3">
          <template slot="title">模型单选操作</template>
          <el-menu-item-group>
            <template slot="title">隐藏</template>
            <el-menu-item index="3-1">隐藏构件</el-menu-item>
            <el-menu-item index="3-2">恢复上一隐藏构件</el-menu-item>
            <el-menu-item index="3-3">恢复所有隐藏构件</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">半透明</template>
            <el-menu-item index="3-4">半透明构件</el-menu-item>
            <el-menu-item index="3-5">恢复上一半透明构件</el-menu-item>
            <el-menu-item index="3-6">恢复所有半透明构件</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">其它</template>
            <el-menu-item index="3-7">跳转到选中的构件</el-menu-item>
            <el-menu-item index="3-8">隔离选中的构件</el-menu-item>
            <el-menu-item index="3-9">恢复隔离构件</el-menu-item>
          </el-menu-item-group>
        </el-submenu>
        <el-submenu index="4">
          <template slot="title">模型多选操作</template>
          <el-menu-item-group>
            <template slot="title">启动</template>
            <el-menu-item index="4-1">开始多选操作</el-menu-item>
            <el-menu-item index="4-2">结束多选操作</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">隐藏</template>
            <el-menu-item index="4-3">隐藏选中构件</el-menu-item>
            <el-menu-item index="4-4">恢复隐藏</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">半透明</template>
            <el-menu-item index="4-5">半透明选中构件</el-menu-item>
            <el-menu-item index="4-6">恢复半透明</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">隔离</template>
            <el-menu-item index="4-7">隔离选中构件</el-menu-item>
            <el-menu-item index="4-8">恢复隔离</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group>
            <template slot="title">其它</template>
            <el-menu-item index="4-9">跳转到选中构件</el-menu-item>
            <el-menu-item index="4-10">清除当前选择集</el-menu-item>
          </el-menu-item-group>
        </el-submenu>
        <el-submenu index="5">
            <template slot="title">数据查看</template>
            <el-menu-item index="5-1">查看视频</el-menu-item>
            <el-menu-item index="5-2">查看温度曲线</el-menu-item>
        </el-submenu>
        <el-menu-item index="6" class="logout">退出登录</el-menu-item>
      </el-menu>
    </div>
    <div id="bimx" ref="bimx"></div>
    <el-dialog v-if="showDialog" :visible.sync="showDialog" :title="dialogTitle" size="large" :before-close='closeDialog'>
        <video-player :options="playerOptions" v-if="playerOptions.sources"></video-player>
        <div id="echartContainer" v-if="!playerOptions.sources"></div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import _ from 'lodash';
import echarts from 'echarts';

export default {
  data (){
      return {
          models: [], // 当前用户下的所有模型信息
          model: {}, // 当前加载对象
          app: null, // 当前应用对象
          viewer: null, // viewer对象
          selection: null, // 当前选中构件
          selectionPropertyData: null, // 当前选中构件的属性
          hiddenElements: [], // 隐藏的构件列表
          translucentElements: [], //半透明的构件列表
          selectionMode: 'singleSelection', // 选择类型
          multiSelections: [], // 当前多选构件
          multiHiddenElements: [], // 多选隐藏构件列表
          multiTranslucentElements: [], // 多选半透明构件列表
          multiIsolateElements: [], // 多选隔离列表
          playerOptions: {}, // 视频播放选项
          showDialog: false, // 是否显示对话框（用于显示视频，曲线等）
          dialogTitle: '', // 对话框标题
          chart: {}, // 图表对象
      }
  },
  created () {
      // 加载模型信息
      axios.get('/api/models')
        .then((response) => {
          var data = response.data;
          if(data.code === 'success'){
              this.models = data.data;
              this.loadModel(this.models[0].modelId);
          }
      });
  },
  methods: {
        // navbar点击处理
        handleMenuSelect (key, keyPath) {
            var self = this;
            if(keyPath[0] === '2'){ // 加载模型
                var modelId = key;
                this.loadModel(modelId);
                return;
            }
            if(key === '6') { // 登出
                this.logout();
                return;
            }
            if(keyPath[0] === '3' && this.selectionMode === 'multiSelection'){
                this.$alert('请先退出多选操作', '操作错误', {
                    confirmButtonText: '我知道了'
                });
                return;
            }
            if(keyPath[0] === '4' && key !== '4-1' && this.selectionMode === 'singleSelection'){
                this.$alert('请先启动多选操作', '操作错误', {
                    confirmButtonText: '我知道了'
                });
                return;
            }
            if(this.viewer === null){
                this.$alert('请先加载模型', '操作错误', {
                    confirmButtonText: '我知道了'
                });
                return;
            }
            switch(key){
                case '3-1':
                    this.hideSelection();
                    break;
                case '3-2':
                    this.showLastHidden();
                    break;
                case '3-3':
                    this.showAllHidden();
                    break;
                case '3-4':
                    this.translucentSelection();
                    break;
                case '3-5':
                    this.showLastTranslucent();
                    break;
                case '3-6':
                    this.showAllTranslucent();
                    break;
                case '3-7':
                    this.zoomToSelectedComponents();
                    break;
                case '3-8':
                    this.isolateSelection();
                    break;
                case '3-9':
                    this.clearIsolation();
                    break;
                case '4-1':
                    this.clearSelections();
                    this.selectionMode = 'multiSelection';
                    break;
                case '4-2':
                    this.clearSelections();
                    this.hideAttributePane();
                    this.selectionMode = 'singleSelection';
                    break;
                case '4-3':
                    this.hideMultiSelection();
                    break;
                case '4-4':
                    this.showMultiSelection();
                    break;
                case '4-5':
                    this.translucentMultiSelection();
                    break;
                case '4-6':
                    this.showTranslucentMultiSelection();
                    break;
                case '4-7':
                  this.isolateMultiSelection();
                  break;
                case '4-8':
                  this.showIsolateMultiSelection();
                  break;
                case '4-9':
                  this.zoomToSelectedComponents();
                  break;
                case '4-10':
                  this.hideAttributePane();
                  this.multiSelections = [];
                  this.clearSelections();
                  break;
                case '5-1':
                    this.playVideo();
                    break;
                case '5-2':
                    this.showTemperatureChart();
                    break;
            }
        },
        // 退出登录
        logout () {
            axios.get('/logout')
              .then((response) => {
                console.log(response.data);
              });
            window.location.href = '/login';
        },
        // 重置变量
        reset() {
            this.app = null;
            this.viewer = null;
            this.selection = null;
            this.hiddenElements = [];
            this.translucentElements = [];
            this.selectionMode = 'singleSelection';
            this.multiSelections = [];
            this.multiHiddenElements = [];
            this.multiTranslucentElements = [];
            this.multiIsolateElements = [];
        },
        // 加载模型
        loadModel (modelId) {
            this.reset();
            var model = this.models[_.findIndex(this.models, {'modelId': modelId})];
            if(this.model === model) {
                return;
            }
            this.model = model;
            axios.get('/api/viewToken', {
                params: {
                    modelId: this.model.modelId,
                    modelType: this.model.modelType
                }
            }).then((response) => {
                this.viewToken = response.data.data;
                this.$refs.bimx.innerHTML = '';
                var bimfaceLoaderConfig = new BimfaceSDKLoaderConfig();
                bimfaceLoaderConfig.viewToken = this.viewToken;
                bimfaceLoaderConfig.configuration = BimfaceConfigrationOption.Debug;
                BimfaceSDKLoader.load(bimfaceLoaderConfig, this.onSDKLoadSucceeded, this.onSDKLoadFailed);
            }).catch((err) => {
                console.log(err);
                this.$message({
                    message: '加载模型失败: 无法获取viweToken',
                    type: 'error'
                });
            })
        },
        onSDKLoadSucceeded (viewMetaData) {
            var webAppConfig = Glodon.Bimface.Application.WebApplication3DConfig();
            webAppConfig.domElement = this.$refs.bimx;
            this.app = new Glodon.Bimface.Application.WebApplication3D(webAppConfig);
            this.app.addView(this.viewToken);
            this.viewer = this.app.getViewer();

            var dataManagerConfig = new Glodon.Bimface.Data.MetaDataManagerConfig();
            dataManagerConfig.viewToken = viewMetaData.viewToken;
            dataManagerConfig.modelId = this.model.modelId;
            dataManagerConfig.modelType = this.model.modelType === 'normal'? 'singleModel': 'integrateModel';
            this.dataManager = new Glodon.Bimface.Data.MetaDataManager(dataManagerConfig);

            var appEvents = Glodon.Bimface.Application.WebApplication3DEvent;

            // 视图加载完毕后事件
            this.app.addEventListener(appEvents.ViewAdded, () => {
                this.viewer.render();
            });

            // 鼠标点击事件
            this.app.addEventListener(appEvents.ComponentsSelectionChanged, (data) => {
                if(!data.objectId){ // 未选中构件

                    this.selection = null;

                    this.hideAttributePane();
                    if(this.selectionMode === 'multiSelection'){ // 保证未选中构件时之前选中的构件也不会消失
                        this.viewer.addSelectedComponentsById(this.multiSelections);
                        this.viewer.render();
                    }
                    return;
                }

                // 获取构件属性并保存下来
                this.dataManager.getComponentProperty(data.objectId, (propertyData) => {
                    this.selectionPropertyData = propertyData;
                });

                // 显示属性面板
                this.showAttributePane();

                // 处理单选和多选
                if(this.selectionMode === 'singleSelection'){ // 单选
                    this.selection = data;
                }else if(this.selectionMode === 'multiSelection'){ // 多选

                    var index = _.indexOf(this.multiSelections, data.objectId);
                    if(index < 0){ // 构件并未选中
                        this.selection = data; // 在多选模式下该变量用来存储用户的当前选择
                        this.multiSelections.push(data.objectId);
                    }else{ // 构件已经选中过，取消对该构件的选择
                        this.selection = null; // 清除当前选择
                        this.multiSelections.splice(index, 1);
                        this.hideAttributePane();
                    }
                    this.viewer.setSelectedComponentsById(this.multiSelections);
                    this.viewer.render();
                }
            });

            // 属性按钮点击事件
            var propertyButton = document.getElementsByClassName('gld-bf-properties')[0];
            propertyButton.addEventListener('click', (e) => {
                // 保证没有构件被选择的时候属性面板是空的，不显示任何数据
                if(propertyButton.className.indexOf('bf-checked') > 0 && this.selection === null){
                    var propertyPaneContainer = document.querySelector('#bimx > div > div.bf-panel.bf-has-title.bf-sizable > div.bf-cantainer'); 
                    this.$nextTick(() => {
                        propertyPaneContainer.innerHTML = '';
                    });
                }
            });

            // 去除广联达about按钮
            var informationButton = document.getElementsByClassName('gld-bf-information')[0];
            informationButton.parentNode.removeChild(informationButton);
        },
        onSDKLoadFailed (err) {
            console.log(err);
            this.$alert('无法加载模型', '加载模型失败', {
                confirmButtonText: '我知道了'
            });
        },
        // 跳转到选择的构件
        zoomToSelectedComponents () {
            this.viewer.zoomToSelectedComponents();
        },
        // 隐藏当前选择构件
        hideSelection () {
            if(this.selection === null){
                return;
            }
            var objectId = this.selection.objectId;
            this.viewer.hideComponents([objectId]);
            this.hiddenElements.push(objectId);
            this.clearSelections();
            this.hideAttributePane();
            this.viewer.render();
        },
        // 显示上一隐藏构件
        showLastHidden () {
            if(this.hiddenElements.length > 0){
                var objectId = this.hiddenElements.pop();
                this.viewer.showComponents([objectId]);
                this.viewer.render();
            }
        },
        // 显示所有隐藏构件
        showAllHidden () {
            if(this.hiddenElements.length > 0){
                this.viewer.showComponents(this.hiddenElements);
                this.viewer.render();
                this.hiddenElements = [];
            }
        },
        // 半透明当前选择构件
        translucentSelection () {
            if(this.selection === null){
              return;
            }
            var objectId = this.selection.objectId;
            this.viewer.setComponentsOpacity([objectId], 'Translucent');
            this.translucentElements.push(objectId);
            this.hideAttributePane();
            this.clearSelections();
            this.viewer.render();
        },
        // 显示上一半透明构件
        showLastTranslucent () {
            if(this.translucentElements.length > 0){
                var objectId = this.translucentElements.pop();
                this.viewer.setComponentsOpacity([objectId], 'Opaque');
                this.viewer.render();
            }
        },
        // 显示所有半透明构件
        showAllTranslucent () {
            if(this.translucentElements.length > 0){
                this.viewer.setComponentsOpacity(this.translucentElements, 'Opaque');
                this.viewer.render();
                this.translucentElements = [];
            }
        },
        // 隔离当前选择构件
        isolateSelection () {
            if(this.selection === null){
              return;
            }
            var objectId = this.selection.objectId;
            this.viewer.isolateComponentsById([objectId], 'MakeOthersTranslucent');
            this.hideAttributePane();
            this.clearSelections();
            this.viewer.render();
        },
        // 显示隔离构件
        clearIsolation () {
            this.viewer.clearIsolation();
            this.viewer.render();
        },
        // 隐藏多选构件
        hideMultiSelection () {
            if(this.multiSelections.length >= 0){
                this.multiSelections.forEach((objectId) => {
                    this.multiHiddenElements.push(objectId);
                });
                this.clearSelections();
                this.viewer.hideComponents(this.multiHiddenElements);
                this.hideAttributePane();
                this.viewer.render();
            }
        },
        // 显示多选构件
        showMultiSelection () {
            this.viewer.showComponents(this.multiHiddenElements);
            this.multiHiddenElements = [];
            this.clearSelections();
            this.viewer.render();
        },
        // 半透明多选构件
        translucentMultiSelection () {
            if(this.multiSelections.length >= 0){
                this.multiSelections.forEach((objectId) => {
                  this.multiTranslucentElements.push(objectId);
                });
                this.clearSelections();
                this.viewer.setComponentsOpacity(this.multiTranslucentElements, 'Translucent');
                this.hideAttributePane();
                this.viewer.render();
            }
        },
        // 显示半透明多选构件
        showTranslucentMultiSelection () {
            this.viewer.setComponentsOpacity(this.multiTranslucentElements, 'Opaque');
            this.multiTranslucentElements = [];
            this.clearSelections();
            this.viewer.render();
        },
        // 隔离多选构件
        isolateMultiSelection () {
            if(this.multiSelections.length > 0){
                this.multiSelections.forEach((objectId) => {
                  this.multiIsolateElements.push(objectId);
                });
                this.clearSelections();
                this.viewer.isolateComponentsById(this.multiIsolateElements);
                this.hideAttributePane();
                this.viewer.render();
            }
        },
        // 显示隔离构件
        showIsolateMultiSelection () {
            this.viewer.clearIsolation();
            this.multiIsolateElements = [];
            this.clearSelections();
            this.viewer.render();
        },
        // 隐藏属性窗口
        hideAttributePane () {
            var propertyButton = document.getElementsByClassName('gld-bf-properties')[0];
            if(propertyButton.className.indexOf('bf-checked') > 0) {
                propertyButton.click();
            }
        },
        // 显示属性窗口
        showAttributePane() {
            var propertyButton = document.getElementsByClassName('gld-bf-properties')[0];
            if(propertyButton.className.indexOf('bf-checked') === -1){
                propertyButton.click();
            }
        },
        // 清除当前选择集
        clearSelections () {
            // 清除单选和多选数据
            this.selection = null;
            this.multiSelections = [];
            if(this.viewer){
                this.viewer.setSelectedComponentsById([]);
                this.viewer.render();
            }
            // 保证属性按钮和属性面板不显示
            var propertyButton = document.getElementsByClassName('gld-bf-properties')[0];
            if(propertyButton.className.indexOf('bf-checked') > 0) {
                propertyButton.click();
            }
        },
        // 播放视频
        playVideo () {
            var self = this;
            if (this.selection === null) { // 未选中构件
                this.$message({
                    message:'请选择想要查看视频的摄像头'
                });
            }else{ // 尝试从服务器获取视频播放选项
                var modelId = this.model.modelId;
                var objectId = this.selection.objectId;
                if(!/(摄像头|camera)/i.test(this.selectionPropertyData.name)){
                    self.$message({
                        message:'当前选择不是摄像头！',
                        type: 'warning'
                    });
                    return;
                }
                axios.get('/api/video', {
                    params: {
                        'modelId': modelId,
                        'objectId': objectId
                    }
                }).then(function(response){
                    var options = response.data.data;
                    if(!options.sources) {
                        self.$message({
                            message:'请选择想要查看视频的摄像头'
                        });
                    }else{
                        self.showDialog = true;
                        self.dialogTitle = '现场视频';
                        self.playerOptions = options;
                    }
                }).catch(function(err){
                    console.log(err);
                    self.$message({
                         message:'服务器错误，请稍后再试'
                    });
                });
            }
        },
        //显示温度曲线
        showTemperatureChart () {
            if (this.selection === null) { // 未选中构件
                this.$message({
                    message:'请选择想要查看温度曲线的温度传感器'
                });
            }else{
                var modelId = this.model.modelId;
                var objectId = this.selection.objectId;
                axios.get('/api/data', {
                    params: {
                        'modelId': modelId,
                        'objectId': objectId,
                        'type': 'temperature'
                    }
                }).then((response) => {
                    var option = response.data.data;
                    if(!option.series){
                        this.$message({
                            message: '请选择温度传感器',
                            type: 'warning'
                        });
                    }else{
                        this.showDialog = true;
                        this.dialogTitle = '温度传感器数据';
                        this.$nextTick(() => { // 保证echarts绘图的dom存在
                            this.chart = echarts.init(document.getElementById('echartContainer'));
                            this.chart.setOption(option);
                        });
                    }
                }).catch((err) => {
                    console.log(err);
                    self.$message({
                         message:'服务器错误，请稍后再试'
                    });
                });
            }
        },
        // 关闭对话框窗口
        closeDialog () {
            console.log('close dialog');
            this.showDialog = false;
            this.dialogTitle = '';
            this.playerOptions = {};
            this.chart.dispose();
        }
    }
};
</script>

<style lang="stylus" rel="stylesheet/stylus">
body
  padding: 0
  margin: 0
  .el-message
    margin-top: 80px
#app
  #navbar
    margin: 0px
    ul.el-menu
      li.logout
        position: fixed
        right: 0px
    div.el-tabs
      height: 100%
  #bimx
    position: fixed
    left: 0px
    right: 0px
    top: 60px
    bottom: 0px
  #echartContainer
    margin: 20px auto
    width: 600px
    height: 600px
</style>
