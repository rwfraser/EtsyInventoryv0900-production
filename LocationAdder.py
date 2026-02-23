import sys
import requests
from sys import argv
"""
This script locates the last used SKU in myearringadvisor inventory, increments by one, and returns that as the current SKU.
SKU numbering system represents the Rack, Shelf, Tray, Bin, and Item Number location for each pair of earrings.
The first character is Rack character, may be up to 62 racks numbered A-Z,a-z,0-9.
The second character is Shelf letter, exactly 20 shelves, numbered a-t.
The third number is Tray number, exactly 4 trays, numbered 1-4.
The fourth character is Bin number, exactly 15 bins, numbered a-o
The fifth and sixth characters are item  number, from 00 - 99, numbered 00-99.  
A valid SKU (and our starting LOCATION): Aa1a01

As of Feb 22/26 dates are not attached at the end of the SKU.  Therefore, replenishing the inventory into existing locations is not supported.  
Support for replenishing inventory can be implemented by retroactively adding a date and item number suffix to all inventory that has not sold
and implementing a hash table to track all sales thereafter. 

New inventory items, could then be assigned the location of previously sold items, which can be identified initially by lack of date suffix. 
When those locations are exhausted, the hash table of sold items will provide available locations.  This approach will fragment the stocking of 
new items, with significant impact on time to stock.

An alternative approach is to increase the items/bin limit from 5 to 7.  Only minor code 
modifications (enforce a max SKU of Bt4o07, restart counter at Aa1a06, and assign only item #s 6 and 7 to each bin before overflowing to the next bin)
would be required to support this approach which is recommended when SKU #Bt4o05 is reached.  myearringadvisor.com total inventory count
at that time would be 12000.  An additional 4800 (2*15*4*40) pairs of earrings could then be accommodated. Total available space: 16,800
At estimated sales volumes of 300 pairs per month/3600 pairs annually, and 1/3rd inventory sale rate, this is 18 months worth of storage.

Goals:  Daily impressions: 100,000 CTR: 1% (1000@$.05 per), Conversion: 1% (10), inventory conversion rate: 50%.  
Imperatives:  State of the art sales bots(1% conversion), and top shelf inventory quality(50% conversion), leading to 15 sales 3x/wk (45/wk, 180/mo) @ $10 net/sale, $1800 net/mo.

ERROR CHECKING/UNIT TESTING:  02/22/26 No unit testing for validity of LOCATION strings.  
"""

def LastUsedLocation():
    """
    Scrape last used SKU from the live site.  DEPRECATED. 
    Last used SKU will need to be read from the database  
    """
    user_agent = {"User-agent": "Mozilla/5.0"}
    SortByLatestMEDPage = str(requests.get("https://myearringdepot.com/?swoof=1&orderby=date", headers=user_agent).text)
    Start_index = SortByLatestMEDPage.find("data-product_sku") + 24
    End_index = Start_index + 6
    LastUsedLOCATION = SortByLatestMEDPage[Start_index:End_index]

    LastUsedLocation = ''
    return LastUsedLOCATION

def NextLocation(LOCATION):
    """returns string LOCATION after adding 1 to the calling parameter"""
    itemchar = LOCATION[4:]
    binchar = LOCATION[3:4]
    traychar = LOCATION[2:3]
    shelfchar = LOCATION[1:2]
    rackchar = LOCATION[0:1]

    carrytobins = False
    carrytotrays = False
    carrytoshelves = False
    carrytorack = False
    interimlocation = rackchar + shelfchar + traychar + binchar + itemchar

    if itemchar == "05":
        itemchar = "01"
        carrytobins = True
    else:
        i = ord(itemchar[1])
        i = i + 1
        itemchar = "0" + chr(i)

    if carrytobins and binchar == "o":
        binchar = "a"
        carrytotrays = True
    elif carrytobins:
        j = ord(binchar[0])
        j = j + 1
        binchar = chr(j)

    if carrytotrays and traychar == "4":
        carrytoshelves = True
        traychar = "1"
    elif carrytotrays:
        k = ord(traychar[0])
        k = k + 1
        traychar = chr(k)

    if carrytoshelves and shelfchar == "t":
        carrytorack = True
        shelfchar = "a"
    elif carrytoshelves:
        l = ord(shelfchar[0])
        l = l + 1
        shelfchar = chr(l)
        print("Shelf is: ", shelfchar)

    if rackchar == "9" and carrytorack:
        print("Storage is full - No location ID available")
    elif carrytorack:
        m = ord(rackchar[0])
        m = m + 1
        rackchar = chr(m)

    LOCATION = rackchar + shelfchar + traychar + binchar + itemchar
    return LOCATION


if __name__ == "__main__":
    """
    Feb 1/2026: 
    Current LOCATION is hardcoded.  Main routine will need to be updated to 
    check for the last issued SKU in database.  If none, then hardcode the 
    last used SKU which should be Ac4O05 => i.e. start of myearringadvisor.com
    inventory will be on the fourth shelf.  
    Design plan calls for earrings to be added in groups of 15 pairs.  
    This will not be enforced in code, as earrings will be manually ingested 
    one pair at a time.  
    """
    NO_LOCATION_IN_DATABASE=False
    LOCATION_IN_DATABASE = 'Ac4o05'
    CURRENT_VERSION = argv[0][:-3]
    COPYRIGHT_VERSION_NOTICE = (
        "<!-- "
        + CURRENT_VERSION
        + "Copyright 2026 myearringadvisor.com All Rights Reserved  -->"
    )
    print(COPYRIGHT_VERSION_NOTICE)
    if NO_LOCATION_IN_DATABASE:
        LOCATION =  "Aa1a01" # 
        print(f"LOCATION of first pair is: ", LOCATION)
    else:
        print(
            f"Last LOCATION =: {LOCATION_IN_DATABASE}, next LOCATION is:  {NextLocation(LOCATION_IN_DATABASE)}"
    )
