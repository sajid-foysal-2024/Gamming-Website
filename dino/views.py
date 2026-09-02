from django.shortcuts import render

# Create your views here.
def dino(request):
    return render(request, 'dino/dino.html')