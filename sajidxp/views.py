from django.contrib import auth, messages
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

from Mandatory.models import HeroSlide, NewsTicker,sajidxpgames
from sajidxp.forms import RegistrationForm


def home(request):
    slides = HeroSlide.objects.filter(is_active=True)
    news_items = NewsTicker.objects.filter(is_active=True)
    games=sajidxpgames.objects.all()
    context={
        'slides':slides,
        'news_items':news_items,
        'games':games,

    }
    return render(request, 'index.html', context)


def register(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth.login(request, user)
            messages.success(request, f'Welcome {user.username}! Your account has been created.')
            return redirect('home')
    else:
        form = RegistrationForm()

    context={
        'form':form,
    }
    return render(request,'register.html',context)


def login(request):
    if request.user.is_authenticated:
        return redirect('home')

    next_url = request.POST.get('next') or request.GET.get('next') or ''

    if request.method == 'POST':
        form = AuthenticationForm(request, request.POST)
        if form.is_valid():
            # AuthenticationForm already checked username/password
            user = form.get_user()
            auth.login(request, user)
            messages.success(request, f'Welcome back, {user.username}!')

            # only redirect to pages on this site
            if url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
                return redirect(next_url)
            return redirect('home')
    else:
        form = AuthenticationForm(request)

    context={
        'form':form,
        'next':next_url,
    }
    return render(request,'login.html',context)


@require_POST
def logout(request):
    auth.logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('home')
