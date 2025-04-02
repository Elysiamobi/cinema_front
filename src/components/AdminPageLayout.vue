<template>
  <div class="admin-page">
    <div class="page-header">
      <h2><slot name="title">{{ title }}</slot></h2>
      <slot name="header-actions"></slot>
    </div>

    <div class="content-section">
      <slot name="filters"></slot>
      
      <transition name="fade" mode="out-in">
        <slot></slot>
      </transition>
      
      <slot name="pagination"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPageLayout',
  props: {
    title: {
      type: String,
      default: '管理页面'
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.page-header h2 {
  margin: 0;
  color: #409EFF;
  font-size: 24px;
  font-weight: 600;
  position: relative;
}

.page-header h2::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #409EFF;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.page-header:hover h2::after {
  width: 100px;
}

.content-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
}

.content-section:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .admin-page {
    padding: 15px;
  }
  
  .content-section {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-header h2 {
    margin-bottom: 15px;
  }
}
</style> 