Sony Ericsson LiveView MW800 NodeJS Demo App
============================
An effort to put the knowledge from the following projects together in a NodeJS example application for using the MW800 in 2017:
- [OpenLiveView](https://github.com/pedronveloso/OpenLiveView)
- [adqmisc/liveview](https://code.google.com/archive/p/adqmisc/source/default/source) ([used migrated repo](https://github.com/markcox/adqmisc/tree/34388406f61880bf93c3165516144629e8e11982/liveview))
- [BurntBrunch/LivelierView](https://github.com/BurntBrunch/LivelierView/blob/master/server.py)

Does it work?
----------------------------
YES!



![image showing set clock functionality](https://lh3.googleusercontent.com/PmBZwlS-i1jaVNUA9o-kkjjNI-k_n9AvCa2OIPtRBFTYYcZui-UYI-gQyKQOwZRpy1LV9K1kvtSQ6dWXFIXskiJUsmu9L_1YDUJrigkj8C0-c-5gKm5CdRjh55LKiQ3LoXnjTkH0suY7D7HDjLvEbQaRCTsJgeUBznVts6Pq87WgZDXuivFGjJ5-Sdvsy7lPUc3HI-SaoKpimQktn7zdcudBYM4IQwXYN2RBC1XR6DL5ASSb5sWC_jT4nlFdpeuBHC7UdKUPPcdPSc9RvLx_6m0z_2KsaRu8uA8e5b-BAk_IHawQ-O7VjIBInzUu1qZ2ajZXz7ZQ1dyprAuUtdCUzdYrIDPzdBb5bursrm59mCbmg4hAiqGoO89q9dqFcJeRwZmhe5JiJWDAQy2xuwuIDutIm4xWsi8lM-JL3nYEyGX4oGlqfBBTnvJzaPcHdca2qH0vGMdDX-uZgC4cjf0ulPXmKbSGacqfWVIPBIkknr3ph0tt8zZntXtBRZZClDiOM750yZUUD5c7Z5xKVfjUl0MoIbvDCa-RMzDUnzKjP8rlU_kDYgh2NDRk4d9Lruu_SAYlmTwT-ngpV9cLtb2sFtl0POTHiDN95VIe3Weu84axA0GVTsQQrvhKSqpVvZ9qRSSX_JqK33mYg8QdEkYfl5pyZ8pVj4O3pY0Zt0rBuN0=h320-no) ![image showing the menu with icons](https://lh3.googleusercontent.com/eCNShrRiK0Mj1KhOGTMaMbhOZcUxsfUUU1Q4gLVpOAAyN10wmWbMCug_vDtIbfw4UuXFT5t18qpvMYHsBz1eR5nm0yiRh6j0ETMfCBq9noaT6OFqJBStSPspa_vAMGBvN-O1Tg-mZ97UPCYvV5wQQEoGuU21GAE8Rfwk-OLmIJuN_-xqimTjKCXYphwOmocUV8dyn-Yku8SxH4T_9MYaymgrrebExmSFM1Sk5WYPQtObL6SINLeAI0FNeaUPQpnNg67iv-Mgr5GY7EbK8cdmDkfYExgpvp-qxoAFyRVXJGz-7QKD9P2D_7UEvXNM9sGp6VP1HATn7mvbxPWU-ITqRT0fkyYiPiKtqrDFr2m0g_d1xcRi1WNB12i609VJJo70uMWLDHVJ72e6hpykM_Arz1ogEUIar0hDzPwaStio1HD23nIN8HPEUNItfMFo61uP8Y0qW1HWBYIXD3GqY_hHB08JWTN3JxkSAOVrrc9LslQX59ofaYfRS_roGiDolX-mndTETsVz3rKU-DezRFRm-p1aj4gG2JuHkIN0vCypPhdehkd0JzTiswd3EFkG_Li0gGVfQs9X2bqWTJbi0lYlzVjjHquUnEzICmt14ya3oeMq4ocVLVq2Eg=h320-no)

What does it do?
----------------------------
- [X] Connect to LiveView device (tested on macOS) if paired
- [X] Decode protocol messages from the LiveView device
- [X] Encode protocol messages to the LiveView device
- [ ] Port all logic from [adqmisc/liveview](https://code.google.com/archive/p/adqmisc/source/default/source)
  - [X] Get software version
  - [X] Get (and parse) device capabilities
  - [X] Set date/time on device
  - [ ] Handle navigation
  - [X] Load MenuItems
  - [ ] Handle MenuItems clicked
  - [X] Vibrate
  - [X] RGB Led
  - [ ] Alarms

And there's probably more to fix.

How do I run it?
----------------------------
```|bash
$ npm install
$ node run
```
If the LiveView device is paired with your computer it should vibrate and show the following output:
```|bash
Waiting...
DisplayCapabilities
GetMenuItems
```

You can kill the script with Ctrl+C.

How do I contribute?
----------------------------
Contact me, open an issue or just pick something from the list. Any contribution is welcome (as long as it doesn't break stuff). I haven't invested that much time in tidying the code up and writing tests.