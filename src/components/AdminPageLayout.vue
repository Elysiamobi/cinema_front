<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>{{ title }}</h2>
      <slot name="header-actions"></slot>
    </div>

    <slot name="search-filters"></slot>
    
    <slot></slot>
    
    <slot name="pagination"></slot>
  </div>
</template>

<script>
export default {
  name: 'AdminPageLayout',
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
}

:slotted(.search-filter-container) {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:slotted(.pagination-container) {
  margin-top: 20px;
  padding: 15px 0;
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

@media (max-width: 768px) {
  :slotted(.search-filter-container) {
    flex-direction: column;
  }
  
  :slotted(.pagination-container) {
    justify-content: center;
  }
}
</style> 