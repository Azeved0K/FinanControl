from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum

from api.models import PiggyBank, PiggyBankTransaction

MONEY_Q = Decimal('0.01')


def _to_decimal_percent(value: Decimal) -> Decimal:
    return (value or Decimal('0')) / Decimal('100')


def yearly_rate_decimal(rate_type: str, rate_value_percent: Decimal) -> Decimal:
    r = _to_decimal_percent(rate_value_percent)
    if rate_type == 'YEARLY':
        return r
    if rate_type == 'MONTHLY':
        return (Decimal('1') + r) ** Decimal('12') - Decimal('1')
    raise ValueError('Invalid rate_type')


def daily_rate_decimal(rate_type: str, rate_value_percent: Decimal) -> Decimal:
    ry = yearly_rate_decimal(rate_type, rate_value_percent)
    return (Decimal('1') + ry) ** (Decimal('1') / Decimal('365')) - Decimal('1')


@dataclass
class DailyRow:
    date: date
    principal: Decimal
    interest: Decimal
    balance: Decimal


def piggybank_principal(piggy_bank: PiggyBank, until: date | None = None) -> Decimal:
    qs = PiggyBankTransaction.objects.filter(piggy_bank=piggy_bank)
    if until is not None:
        qs = qs.filter(date__lte=until)

    dep = qs.filter(type='DEPOSIT').aggregate(total=Sum('amount'))['total'] or Decimal('0')
    wdr = qs.filter(type='WITHDRAW').aggregate(total=Sum('amount'))['total'] or Decimal('0')
    return dep - wdr


def piggybank_daily_series(piggy_bank: PiggyBank, start: date, end: date) -> list[DailyRow]:
    if end < start:
        return []

    rd = daily_rate_decimal(piggy_bank.rate_type, piggy_bank.rate_value)

    # saldo antes do início (acumula principal e juros até start-1)
    principal_before = piggybank_principal(piggy_bank, until=start - timedelta(days=1))

    # para simplificar, começamos o saldo como o principal (sem juros) e vamos acumulando juros do período.
    # isso dá uma boa estimativa e é leve.
    running_balance = principal_before

    tx_qs = PiggyBankTransaction.objects.filter(piggy_bank=piggy_bank, date__gte=start, date__lte=end)
    tx_by_day = {}
    for row in tx_qs.values('date', 'type').annotate(total=Sum('amount')):
        d = row['date']
        tx_by_day.setdefault(d, {'DEPOSIT': Decimal('0'), 'WITHDRAW': Decimal('0')})
        tx_by_day[d][row['type']] = row['total'] or Decimal('0')

    out: list[DailyRow] = []
    cur = start
    while cur <= end:
        day_tx = tx_by_day.get(cur, {'DEPOSIT': Decimal('0'), 'WITHDRAW': Decimal('0')})
        running_balance += day_tx['DEPOSIT']
        running_balance -= day_tx['WITHDRAW']

        interest = (running_balance * rd).quantize(MONEY_Q, rounding=ROUND_HALF_UP)
        running_balance = (running_balance + interest).quantize(MONEY_Q, rounding=ROUND_HALF_UP)

        out.append(DailyRow(date=cur, principal=piggybank_principal(piggy_bank, until=cur), interest=interest, balance=running_balance))
        cur += timedelta(days=1)

    return out
