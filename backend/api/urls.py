from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, TransactionViewSet,
    CustomAuthToken, register_user, logout_user,
    financial_insights,
    me, PiggyBankViewSet, PiggyBankTransactionViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'piggy_banks', PiggyBankViewSet, basename='piggybank')
router.register(r'piggy_bank_transactions', PiggyBankTransactionViewSet, basename='piggybanktransaction')

urlpatterns = [
    # Autenticação
    path('auth/login/', CustomAuthToken.as_view(), name='login'),
    path('auth/register/', register_user, name='register'),
    path('auth/logout/', logout_user, name='logout'),
    path('auth/me/', me, name='me'),

    # Insights
    path('insights/', financial_insights, name='insights'),

    # Router URLs
    path('', include(router.urls)),
]
