from django.shortcuts import render
from Mandatory.models import HeroSlide, NewsTicker,sajidxpgames

def home(request):
    slides = HeroSlide.objects.all()
    news_items = NewsTicker.objects.filter(is_active=True)
    games=sajidxpgames.objects.all()
    context={
        'slides':slides,
        'news_items':news_items,
        'games':games,

    }
    return render(request, 'index.html', context)