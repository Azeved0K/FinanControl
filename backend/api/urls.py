from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, TransactionViewSet,
    CustomAuthToken, register_user, logout_user,
    financial_insights
)

# Configurar o router para as ViewSets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    # Autenticação
    path('auth/login/', CustomAuthToken.as_view(), name='login'),
    path('auth/register/', register_user, name='register'),
    path('auth/logout/', logout_user, name='logout'),
    
    # Insights
    path('insights/', financial_insights, name='insights'),
    
    # Router URLs
    path('', include(router.urls)),
]