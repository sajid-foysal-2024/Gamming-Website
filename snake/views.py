from django.shortcuts import render,get_object_or_404



# Create your views here.
def snake(request):
    return render(request, 'snake/snake.html')
