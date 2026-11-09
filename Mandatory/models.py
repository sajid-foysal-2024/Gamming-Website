from django.db import models
from django.urls import NoReverseMatch, reverse


class HeroSlide(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='hero/')
    button_text = models.CharField(max_length=50, default='Read More')
    button_url = models.CharField(max_length=200, default='#')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title



class NewsTicker(models.Model):
    CATEGORY_CHOICES = [
        ('new', 'New'),
        ('strategy', 'Strategy'),
        ('racing', 'Racing'),
        ('adventure', 'Adventure'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='new')
    text = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)  # lower number is shown first

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text



class sajidxpgames(models.Model):
    tag=models.CharField(max_length=10)
    title = models.CharField(max_length=20)
    sort_desc=models.CharField(max_length=30)
    image = models.ImageField(upload_to='sajidxpgames/')
    url_name = models.CharField(max_length=50,default='home')

    def get_play_url(self):
        # A wrong url_name in admin should not crash the home page.
        try:
            return reverse(self.url_name)
        except NoReverseMatch:
            return '#'

    def __str__(self):
        return self.title