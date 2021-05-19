WebFont.load({  google: {    families: ["Montserrat:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic"]  }});

!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);


 $('img').bind('contextmenu', function(e) {return false;});
 $(document).on('contextmenu', 'img', function() {return false;});

 $(document).on('change', 'label.w-checkbox.checkbox-block input', function(event){
   event.preventDefault();
   if($(this).parents('.w-checkbox').find('.w-checkbox-input').hasClass('w--redirected-checked'))
    $(this).parents('.w-checkbox').find('.w-checkbox-input').removeClass('w--redirected-checked');
    else
    $(this).parents('.w-checkbox').find('.w-checkbox-input').addClass('w--redirected-checked');
 });
 $(document).on('click', 'div.devicefilter', function(event){
   event.preventDefault();
   $("div.filter-block").show();
 });
 $(document).on('click', 'a.filter-close.w-button', function(event){
   event.preventDefault();
   $("div.filter-block").hide();
 });
 $(document).on('click', 'a.nav-link w-nav-link', function(event){
   event.preventDefault();
   $(this).addClass('w--current');
 });

// $(document).on('click', '.ab-menu-button', function(e){
//   e.preventDefault()
//   if(!$('.nav-container .w-nav-overlay#w-nav-overlay-0').length) {
//     let width = $(window).width()
//     if($('#w-nav-overlay-10:visible').length) {

//       $('.ab-burger-wrapper .burger-up').css({
//         ['transform-style']: 'preserve-3d',
//         transition: 'transform 300ms ease 0s',
//         transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px) translateZ(0px)'
//       });


//       $('.ab-burger-wrapper .burger-down').css({
//         ['transform-style']: 'preserve-3d',
//         transition: 'transform 300ms ease 0s',
//         transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px) translateZ(0px)'
//       });

//       let i = 0;
//       let interval = setInterval(function(){ 
//         if((i + width) >= 0) {
//         $('#w-nav-overlay-10 nav').css({transform: `translateX(${i}px)`}) 
//           i -= 6
//         } else {
//           $('#w-nav-overlay-10').css({display:'none'})
//            clearInterval(interval);
//          }
//       }, 1);
//     }
//     else {
//       $('.ab-container.w-container.nav-wrapper').after(`<div style="display:contents" class="w-nav-overlay" data-wf-ignore="" id="w-nav-overlay-10">
//         <nav role="navigation" class="ab-nav-menu w-nav-menu" data-nav-menu-open="" style="height:2597px">
//           <a class="nav-link w-nav-link w--nav-link-open" href="/aircraft/p/1" style={{maxWidth: '728px'}}>Aircraft</a>
//           <a class="nav-link w-nav-link w--current w--nav-link-open" href="/engine/p/1" style={{maxWidth: '728px'}}>Engines</a>
//           <a class="nav-link w-nav-link w--nav-link-open" href="/apu/p/1" style={{maxWidth: '728px'}}>APU</a>
//           <a class="nav-link w-nav-link w--nav-link-open" href="/parts/p/1" style={{maxWidth: '728px'}}>Parts</a>
//           <a class="nav-link w-nav-link w--nav-link-open" href="/wanted/p/1" style={{maxWidth: '728px'}}>Wanted</a>
//           <a class="nav-link w-nav-link w--nav-link-open" href="/contact/p/1" style={{maxWidth: '728px'}}>Contacts</a>
//           <a class="nav-link w-nav-link w--nav-link-open" href="/company/p/1" style={{maxWidth: '728px'}}>Companies</a>
//           <a class="nav-link w-nav-link w--nav-link-open" href="/airport/p/1" style={{maxWidth: '728px'}}>Airports</a>
//           <a class="nav-link support-nav-link w-nav-link w--nav-link-open" href="/support" style={{maxWidth: '728px'}}>support</a>
//          </nav>
//         </div>`)

//           $('#w-nav-overlay-10').css({display:'contents'})

//       $('.ab-burger-wrapper .burger-up').css({
//         ['transform-style']: 'preserve-3d',
//         transition: 'transform 300ms ease 0s',
//         transform: 'rotateX(0deg) rotateY(0deg) rotateZ(-42deg) translateX(-4px) translateY(0px) translateZ(0px)'
//       });


//       $('.ab-burger-wrapper .burger-down').css({
//         ['transform-style']: 'preserve-3d',
//         transition: 'transform 300ms ease 0s',
//         transform: 'rotateX(0deg) rotateY(0deg) rotateZ(42deg) translateX(-4px) translateY(0px) translateZ(0px)'
//       });

//       let interval = setInterval(function(){ 
//         if(width >= 0) {
//         $('#w-nav-overlay-10 nav').css({transform: `translateX(-${width}px)`}) 
//         width -= 6
//         } else {
//           $('#w-nav-overlay-10 nav').css({transform: `translateX(0px)`}) 
//            clearInterval(interval);
//          }
//       }, 1);
      
//     }
//   }
// })