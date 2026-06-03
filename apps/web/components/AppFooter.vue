<template>
  <footer class="mt-12 border-t bg-white">
    <div class="site-container py-10">
      <div class="grid grid-cols-4 gap-8 text-sm bp-1024:grid-cols-2 bp-480:grid-cols-1">
        <div>
          <p class="font-semibold text-emerald-700 mb-3">SimpleMall</p>
          <p class="text-gray-500 leading-relaxed">轻量电商演示系统，支持商品、购物车与模拟支付。</p>
        </div>
        <div>
          <p class="font-medium text-gray-800 mb-3">购物</p>
          <ul class="space-y-2 text-gray-600">
            <li><NuxtLink to="/products" class="hover:text-emerald-600">全部商品</NuxtLink></li>
            <li><NuxtLink to="/cart" class="hover:text-emerald-600">购物车</NuxtLink></li>
            <li><NuxtLink to="/orders" class="hover:text-emerald-600">我的订单</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="font-medium text-gray-800 mb-3">账户</p>
          <ul class="space-y-2 text-gray-600">
            <li><NuxtLink to="/login" class="hover:text-emerald-600">登录</NuxtLink></li>
            <li><NuxtLink to="/register" class="hover:text-emerald-600">注册</NuxtLink></li>
            <li><NuxtLink to="/user/addresses" class="hover:text-emerald-600">收货地址</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="font-medium text-gray-800 mb-3">帮助</p>
          <ul class="space-y-2 text-gray-500">
            <li>客服热线：400-000-0000</li>
            <li>服务时间：9:00 - 18:00</li>
          </ul>
        </div>
      </div>
      <p class="text-center text-xs text-gray-400 mt-8">© {{ year }} SimpleMall Demo. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>
